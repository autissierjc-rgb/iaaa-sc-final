# IAAA · Staging Deployment Guide

Exact commands for deploying IAAA on OVH VPS (Ubuntu 22.04+).
Run steps in order. Do not skip.

---

## Variable reference — build vs runtime

| Variable | Where set | When consumed |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `.env` → `build.args` | `docker build` — baked into JS bundle |
| `NEXT_PUBLIC_API_URL` | `.env` → `build.args` | `docker build` — baked into JS bundle |
| `INTERNAL_API_BASE_URL` | `docker-compose.yml` `environment:` | Container runtime (Next.js server-side) |
| `DATABASE_URL` | `.env` via `env_file` | Container runtime |
| `SECRET_KEY`, AI keys, Stripe | `.env` via `env_file` | Container runtime |

**Rule:** `NEXT_PUBLIC_*` must be in `.env` before `docker compose build`.
A rebuild is required if they change.

---

## Step 0 — Server setup (first deploy only)

```bash
ssh user@YOUR_VPS_IP

# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Docker Compose plugin + tools
sudo apt-get install -y docker-compose-plugin jq curl git dnsutils

# Verify
docker --version && docker compose version
```

---

## Step 1 — Clone repository

```bash
git clone git@github.com:YOUR_ORG/iaaa.git /opt/iaaa
cd /opt/iaaa
```

---

## Step 2 — Environment configuration

```bash
cp .env.staging.example .env
nano .env
```

Fill in order:
1. `POSTGRES_PASSWORD` — strong random string
2. `SECRET_KEY` — `python3 -c "import secrets; print(secrets.token_hex(32))"`
3. `DATABASE_URL` — same password, host = `postgres` (not `localhost`)
4. `NEXT_PUBLIC_APP_URL=https://staging.iaaa.app`
5. `NEXT_PUBLIC_API_URL=https://staging.iaaa.app/api`
6. `DOMAIN=staging.iaaa.app`
7. At least one AI key (`OPENROUTER_API_KEY` recommended for staging)
8. Stripe test keys

```bash
# Verify no placeholders remain
grep "CHANGE_ME" .env && echo "ERROR: unfilled" || echo "OK"
```

---

## Step 3 — Preflight checks

```bash
chmod +x scripts/preflight.sh scripts/smoke_test.sh
./scripts/preflight.sh staging.iaaa.app
```

Expected: `Preflight passed. Safe to proceed with deployment.`

**Do not proceed if DNS check fails.** Wait for propagation, then re-run.

---

## Step 4 — Nginx HTTP-only (first boot)

```bash
# HTTP-only config for initial boot + ACME challenge
cp nginx/conf.d/iaaa-http-only.conf nginx/conf.d/iaaa.conf
```

---

## Step 5 — Build and start

```bash
# First deploy: --no-cache ensures clean build with correct env vars
docker compose build --no-cache
# Normal redeploy: docker compose build  (faster, uses layer cache)

# Start all services
docker compose up -d

# Poll until all services healthy (install watch: sudo apt-get install -y watch)
# Option A — with watch:
#   watch docker compose ps
# Option B — without watch:
for i in {1..12}; do docker compose ps; sleep 5; done
```

---

## Step 6 — Verify services

```bash
docker compose ps
docker compose logs backend --tail=50
docker compose logs frontend --tail=50
docker compose logs nginx --tail=20

# Direct backend health check — bypasses nginx (useful if proxy issues suspected)
docker compose exec backend curl -s http://localhost:8000/api/health
# → {"status":"ok","version":"1.0.0"}

# Via nginx reverse proxy (HTTP)
curl http://localhost/api/health
# → same

# Via public domain
curl http://staging.iaaa.app/api/health
# → same
```

If backend logs show `relation "users" does not exist`:
```bash
docker compose down -v && docker compose up -d
```

---

## Step 7 — Let's Encrypt

DNS must resolve `staging.iaaa.app` to this VPS IP (confirmed in Step 3).

```bash
sudo apt-get install -y certbot

sudo certbot certonly --webroot \
  -w /opt/iaaa/nginx/certbot/www \
  -d staging.iaaa.app \
  --email YOUR_EMAIL@domain.com \
  --agree-tos --non-interactive

# Copy certs to nginx volume
sudo mkdir -p /opt/iaaa/nginx/certbot/conf
sudo cp -rL /etc/letsencrypt/. /opt/iaaa/nginx/certbot/conf/
```

---

## Step 8 — Switch to HTTPS

```bash
# Copy on the HOST — this updates the file nginx container reads via volume mount
cp nginx/conf.d/iaaa-https.conf nginx/conf.d/iaaa.conf

# Test config validity, then reload — no downtime
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload

# Verify HTTPS
curl https://staging.iaaa.app/api/health

# Verify redirect
curl -I http://staging.iaaa.app/
# → 301 https://staging.iaaa.app/
```

---

## Step 9 — Smoke tests

```bash
./scripts/smoke_test.sh https://staging.iaaa.app
```

Expected: `All smoke checks passed. System is operational.`

---

## Step 10 — Cert renewal cron

```bash
# The renewal logic lives in a dedicated script (easier to debug and maintain)
chmod +x /opt/iaaa/scripts/renew_certs.sh

sudo crontab -e
# Add:
0 3 * * * /opt/iaaa/scripts/renew_certs.sh >> /var/log/iaaa-cert-renew.log 2>&1
```

---

## Redeploy

```bash
cd /opt/iaaa
git pull origin main
docker compose build  # layer cache used — faster than --no-cache
docker compose up -d --no-deps backend
docker compose up -d --no-deps frontend
docker compose exec nginx nginx -s reload
./scripts/smoke_test.sh https://staging.iaaa.app
```

---

## Troubleshooting

**Backend won't start**
```bash
docker compose logs backend --tail=100
# DATABASE_URL uses localhost? → change to postgres
# SECRET_KEY missing? → add to .env
```

**Frontend build fails**
```bash
docker compose logs frontend --tail=100
# NEXT_PUBLIC_* missing? → fill .env, then: docker compose build --no-cache frontend
```

**Tables missing**
```bash
docker compose exec postgres psql -U iaaa_staging_user -d iaaa_staging -c "\dt"
# Empty? → docker compose down -v && docker compose up -d
```

**Cookies not set after SSL**
```bash
curl -v https://staging.iaaa.app/api/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"x@x.com","password":"x"}' 2>&1 | grep -i set-cookie
# access_token must appear with Secure flag
# If not: verify X-Forwarded-Proto in nginx config
```

**Certbot fails**
```bash
dig staging.iaaa.app           # must resolve to this VPS
curl http://staging.iaaa.app/  # nginx must be serving on port 80
```

**Smoke check 5 fails (generate timeout)**
```bash
docker compose exec backend env | grep AI_PROVIDER
curl -X POST https://staging.iaaa.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{"situation":"test"}' --max-time 45
```
