#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# IAAA · deploy.sh
# One-command deploy to OVH staging or production.
#
# Usage:
#   ./deploy.sh staging     → deploy to staging (iaaa-staging)
#   ./deploy.sh production  → deploy to production (iaaa.fr / situationcard.com)
#   ./deploy.sh             → defaults to staging
#
# Requires:
#   - Docker + Docker Compose on remote
#   - SSH access configured (~/.ssh/config)
#   - .env.staging or .env.production in project root
#   - Remote: /opt/iaaa/ directory writable
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

ENV="${1:-staging}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="deploy_${ENV}_${TIMESTAMP}.log"

# ── Colours ───────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; NC='\033[0m'; BOLD='\033[1m'

log()  { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $*" | tee -a "$LOG_FILE"; }
ok()   { echo -e "${GREEN}✓${NC} $*" | tee -a "$LOG_FILE"; }
warn() { echo -e "${YELLOW}⚠${NC} $*" | tee -a "$LOG_FILE"; }
fail() { echo -e "${RED}✗${NC} $*" | tee -a "$LOG_FILE"; exit 1; }

# ── Config ─────────────────────────────────────────────────────
if [[ "$ENV" == "production" ]]; then
  SSH_HOST="iaaa-prod"
  ENV_FILE=".env.production"
  REMOTE_DIR="/opt/iaaa"
  COMPOSE_FILE="docker-compose.prod.yml"
else
  SSH_HOST="iaaa-staging"
  ENV_FILE=".env.staging"
  REMOTE_DIR="/opt/iaaa-staging"
  COMPOSE_FILE="docker-compose.yml"
fi

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
echo -e "${BOLD}  IAAA Deploy → ${ENV^^}${NC}"
echo -e "${BOLD}  $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
echo ""

# ── Pre-flight checks ──────────────────────────────────────────
log "Pre-flight checks..."

[[ -f "$ENV_FILE" ]]      || fail "Missing $ENV_FILE"
[[ -f "$COMPOSE_FILE" ]]  || fail "Missing $COMPOSE_FILE"

# Check SSH
ssh -q -o BatchMode=yes -o ConnectTimeout=5 "$SSH_HOST" exit 2>/dev/null \
  || fail "Cannot reach $SSH_HOST — check SSH config"

ok "Pre-flight passed"

# ── Run preflight script ──────────────────────────────────────
if [[ -f "./preflight.sh" ]]; then
  log "Running preflight.sh..."
  bash ./preflight.sh || fail "Preflight failed"
  ok "Preflight passed"
fi

# ── Build frontend ──────────────────────────────────────────────
log "Building frontend..."
cd frontend
npm ci --silent
npm run build 2>>"../$LOG_FILE" || fail "Frontend build failed"
cd ..
ok "Frontend built"

# ── Sync files to remote ───────────────────────────────────────
log "Syncing to $SSH_HOST:$REMOTE_DIR ..."
rsync -az --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='frontend/.next/cache' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='.env*' \
  ./ "$SSH_HOST:$REMOTE_DIR/" \
  >> "$LOG_FILE" 2>&1 || fail "rsync failed"

# Sync env file separately (not excluded)
rsync -az "$ENV_FILE" "$SSH_HOST:$REMOTE_DIR/.env" >> "$LOG_FILE" 2>&1

ok "Files synced"

# ── Run DB migrations ──────────────────────────────────────────
log "Running DB migrations..."
ssh "$SSH_HOST" "
  cd $REMOTE_DIR
  set -a; source .env; set +a
  psql \$DATABASE_URL -f postgres/situation_input_migration.sql  2>/dev/null || true
  psql \$DATABASE_URL -f postgres/intention_migration.sql        2>/dev/null || true
  echo 'Migrations done'
" >> "$LOG_FILE" 2>&1 || warn "Migration step had warnings (may already be applied)"

ok "Migrations done"

# ── Docker deploy ──────────────────────────────────────────────
log "Deploying containers..."
ssh "$SSH_HOST" "
  cd $REMOTE_DIR
  docker compose -f $COMPOSE_FILE pull --quiet 2>/dev/null || true
  docker compose -f $COMPOSE_FILE up -d --build --remove-orphans
  docker compose -f $COMPOSE_FILE ps
" >> "$LOG_FILE" 2>&1 || fail "Docker deploy failed"

ok "Containers running"

# ── Health check ────────────────────────────────────────────────
log "Health check (15s)..."
sleep 15

if [[ "$ENV" == "production" ]]; then
  HEALTH_URL="https://iaaa.fr/api/health"
else
  HEALTH_URL="http://$SSH_HOST:8000/api/health"
fi

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$HEALTH_URL" 2>/dev/null || echo "000")

if [[ "$HTTP_CODE" == "200" ]]; then
  ok "Health check passed (HTTP $HTTP_CODE)"
else
  warn "Health check returned HTTP $HTTP_CODE — run smoke_test.sh to investigate"
fi

# ── Smoke test ─────────────────────────────────────────────────
if [[ -f "./smoke_test.sh" ]]; then
  log "Running smoke tests..."
  bash ./smoke_test.sh "$ENV" >> "$LOG_FILE" 2>&1 && ok "Smoke tests passed" || warn "Some smoke tests failed — check $LOG_FILE"
fi

# ── Summary ────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  Deploy complete → ${ENV^^}${NC}"
echo -e "${BOLD}  Log: $LOG_FILE${NC}"
if [[ "$ENV" == "production" ]]; then
  echo -e "${BOLD}  https://iaaa.fr${NC}"
  echo -e "${BOLD}  https://situationcard.com${NC}"
else
  echo -e "${BOLD}  http://$SSH_HOST${NC}"
fi
echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
echo ""
