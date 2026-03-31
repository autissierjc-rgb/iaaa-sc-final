#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# IAAA · Preflight Checks · Bloc 12
#
# Run this BEFORE `docker compose up` on the staging VPS.
# Catches the most common deployment failures before they happen.
#
# Usage:
#   ./scripts/preflight.sh staging.iaaa.app
#   ./scripts/preflight.sh iaaa.app
#
# Exit code: 0 = all passed, 1 = at least one failure
# ──────────────────────────────────────────────────────────────────────────────

set -uo pipefail

DOMAIN="${1:-staging.iaaa.app}"
PASS=0
FAIL=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RESET='\033[0m'
BOLD='\033[1m'

pass() { echo -e "  ${GREEN}✓${RESET}  $1"; ((PASS++)); }
fail() { echo -e "  ${RED}✗${RESET}  $1"; ((FAIL++)); }
warn() { echo -e "  ${YELLOW}!${RESET}  $1"; }
section() { echo -e "\n${BOLD}$1${RESET}"; }

echo -e "\n${BOLD}IAAA Preflight Checks${RESET}"
echo "  Domain: $DOMAIN"
echo "  Time:   $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "────────────────────────────────────────────────────────────────────────"

# ── 1. Tools ──────────────────────────────────────────────────────────────────
section "1. Required tools"

for tool in docker curl; do
  if command -v $tool &>/dev/null; then
    pass "$tool installed ($(command -v $tool))"
  else
    fail "$tool not found — install before proceeding"
  fi
done

if command -v jq &>/dev/null; then
  pass "jq installed (recommended for smoke tests)"
else
  warn "jq not installed — smoke test card extraction will use fallback"
fi

if docker compose version &>/dev/null; then
  pass "docker compose plugin available"
else
  fail "docker compose plugin not found — run: sudo apt-get install docker-compose-plugin"
fi

# ── 2. DNS ────────────────────────────────────────────────────────────────────
section "2. DNS resolution"

VPS_IP=$(curl -s --max-time 5 ifconfig.me || echo "unknown")
echo "  VPS public IP: $VPS_IP"

if command -v dig &>/dev/null; then
  DNS_IP=$(dig +short "$DOMAIN" | head -1)
elif command -v nslookup &>/dev/null; then
  DNS_IP=$(nslookup "$DOMAIN" 2>/dev/null | awk '/^Address: / { print $2 }' | tail -1)
else
  DNS_IP=""
  warn "dig and nslookup not available — skipping DNS check"
fi

if [[ -n "$DNS_IP" ]]; then
  echo "  DNS resolves $DOMAIN → $DNS_IP"
  if [[ "$DNS_IP" == "$VPS_IP" ]]; then
    pass "DNS points to this VPS — certbot will succeed"
  else
    fail "DNS $DOMAIN → $DNS_IP does not match VPS IP $VPS_IP"
    warn "Do NOT run certbot until DNS propagates to this VPS"
  fi
fi

# ── 3. .env file ──────────────────────────────────────────────────────────────
section "3. Environment file"

if [[ ! -f ".env" ]]; then
  fail ".env file not found — copy .env.staging.example to .env and fill values"
else
  pass ".env file exists"

  # Check required keys
  REQUIRED=(
    POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD DATABASE_URL
    SECRET_KEY
    NEXT_PUBLIC_APP_URL NEXT_PUBLIC_API_URL
    DOMAIN
  )
  for key in "${REQUIRED[@]}"; do
    if grep -q "^${key}=.\+" .env 2>/dev/null; then
      pass "$key is set"
    else
      fail "$key is missing or empty in .env"
    fi
  done

  # Check for unfilled placeholders
  if grep -q "CHANGE_ME" .env; then
    fail ".env still contains CHANGE_ME placeholders — fill all values"
  else
    pass "No CHANGE_ME placeholders in .env"
  fi

  # Check DATABASE_URL uses 'postgres' not 'localhost'
  if grep "DATABASE_URL" .env | grep -q "localhost"; then
    fail "DATABASE_URL uses 'localhost' — must use 'postgres' (Docker service name)"
  else
    pass "DATABASE_URL host is not localhost"
  fi

  # Check NEXT_PUBLIC_APP_URL matches DOMAIN
  PUB_URL=$(grep "^NEXT_PUBLIC_APP_URL=" .env | cut -d= -f2)
  ENV_DOMAIN=$(grep "^DOMAIN=" .env | cut -d= -f2)
  if echo "$PUB_URL" | grep -q "$ENV_DOMAIN"; then
    pass "NEXT_PUBLIC_APP_URL matches DOMAIN"
  else
    warn "NEXT_PUBLIC_APP_URL ($PUB_URL) may not match DOMAIN ($ENV_DOMAIN)"
  fi
fi

# ── 4. Docker Compose config ──────────────────────────────────────────────────
section "4. Docker Compose config"

if docker compose config --quiet 2>/dev/null; then
  pass "docker compose config is valid"
else
  fail "docker compose config invalid — run 'docker compose config' to see errors"
fi

# ── 5. Ports available ────────────────────────────────────────────────────────
section "5. Port availability"

for port in 80 443; do
  if ss -tlnp 2>/dev/null | grep -q ":$port " || \
     netstat -tlnp 2>/dev/null | grep -q ":$port "; then
    warn "Port $port is already in use — may conflict with Nginx"
  else
    pass "Port $port is available"
  fi
done

# ── 6. Disk space ─────────────────────────────────────────────────────────────
section "6. Disk space"

AVAIL=$(df -BG / | awk 'NR==2 {print $4}' | tr -d 'G')
if [[ "$AVAIL" -ge 5 ]]; then
  pass "Disk space available: ${AVAIL}GB (minimum 5GB recommended)"
else
  fail "Low disk space: ${AVAIL}GB — Docker images require at least 5GB"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
TOTAL=$((PASS + FAIL))
echo ""
echo "────────────────────────────────────────────────────────────────────────"
echo -e "${BOLD}Results: $PASS/$TOTAL passed${RESET}"

if [[ $FAIL -eq 0 ]]; then
  echo -e "${GREEN}${BOLD}Preflight passed. Safe to proceed with deployment.${RESET}"
  exit 0
else
  echo -e "${RED}${BOLD}$FAIL check(s) failed. Fix before running docker compose up.${RESET}"
  exit 1
fi
