#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# IAAA · Certificate Renewal Script
#
# Called by cron — see DEPLOY.md Step 10.
# Cron entry: 0 3 * * * /opt/iaaa/scripts/renew_certs.sh >> /var/log/iaaa-cert-renew.log 2>&1
#
# Logic:
#   1. Attempt certbot renew (no-op if cert not due — exit non-zero never aborts)
#   2. Check if cert was actually modified in the last 60 minutes
#   3. If yes: sync certs to nginx volume + test config + reload nginx
#   4. If no:  log no-op, exit cleanly
# ──────────────────────────────────────────────────────────────────────────────

set -uo pipefail

IAAA_DIR="/opt/iaaa"
CERT_DEST="$IAAA_DIR/nginx/certbot/conf"
DOMAIN="${DOMAIN:-staging.iaaa.app}"
CERT_FILE="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"

log() { echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] $*"; }

log "Starting cert renewal check (domain: $DOMAIN)"

# ── Step 1 — attempt renewal ──────────────────────────────────────────────────
if certbot renew --quiet; then
  log "certbot renew: completed (cert renewed or already up to date)"
else
  rc=$?
  log "WARN: certbot renew exited with $rc — continuing to check cert timestamp"
fi

# ── Step 2 — detect actual cert change (modified in last 60 min) ──────────────
if [[ ! -f "$CERT_FILE" ]]; then
  log "ERROR: cert file not found at $CERT_FILE — aborting sync"
  exit 1
fi

RECENTLY_CHANGED=$(find "$CERT_FILE" -mmin -60 2>/dev/null)

if [[ -z "$RECENTLY_CHANGED" ]]; then
  log "Cert not modified recently — no sync or reload needed"
  exit 0
fi

# ── Step 3 — sync and reload ──────────────────────────────────────────────────
mkdir -p "$CERT_DEST"

log "Cert was renewed — syncing to $CERT_DEST"
cp -rL /etc/letsencrypt/. "$CERT_DEST/"
log "Certs synced"

log "Testing nginx config before reload"
if ! docker compose -f "$IAAA_DIR/docker-compose.yml" exec -T nginx nginx -t; then
  log "ERROR: nginx config test failed — reload aborted to avoid outage"
  exit 1
fi

docker compose -f "$IAAA_DIR/docker-compose.yml" exec -T nginx nginx -s reload
log "Nginx reloaded successfully"

log "Done"
