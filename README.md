# IAAA · Situation Intelligence Platform
## Bloc 0 — Implementation Environment

**Status:** Architecture aligned. Environment ready. No features built yet.

---

## Stack (frozen — no additions without explicit block instruction)

| Layer | Technology |
|---|---|
| Frontend | Next.js + Tailwind CSS |
| Backend | FastAPI (monolith) + uvicorn |
| Database | PostgreSQL 16 |
| Billing | Stripe |
| Infra | OVH VPS (single) |
| Deploy | Docker Compose |
| Reverse proxy | Nginx |
| SSL | Let's Encrypt / Certbot |

**Redis: removed from V1.** Rate limiting = tier check only at service layer.

---

## Project Structure

```
iaaa/
├── docker-compose.yml          # 4 services: nginx · frontend · backend · postgres
├── .env.example                # copy to .env, fill secrets
├── .gitignore
│
├── nginx/
│   └── conf.d/iaaa.conf        # reverse proxy config
│
├── postgres/
│   └── init.sql                # full V1 schema — runs on first container start
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # FastAPI app + health check
│       ├── core/
│       │   ├── config.py       # settings from .env
│       │   └── contracts.py    # frozen JSON contracts — do not modify
│       ├── api/routes/         # routes added per block
│       ├── db/                 # session + base (Bloc 2)
│       ├── models/             # SQLAlchemy models (Bloc 2)
│       ├── schemas/            # Pydantic schemas (Bloc 2)
│       └── services/           # business logic (Bloc 2+)
│
└── frontend/
    ├── Dockerfile
    ├── next.config.js
    └── src/
        ├── app/                # Next.js App Router pages (Bloc 1+)
        ├── components/         # UI components (Bloc 1+)
        ├── lib/                # API client, utils (Bloc 2+)
        └── types/index.ts      # frozen TypeScript contracts
```

---

## Frozen JSON Contracts

### Situation Card
```json
{
  "title": "",
  "objective": "",
  "overview": "",
  "forces": [],
  "tensions": [],
  "vulnerabilities": [],
  "main_vulnerability": "",
  "trajectories": [],
  "constraints": [],
  "uncertainty": [],
  "reflection": ""
}
```

### Star Map Exploration (per branch)
```json
{
  "dimension": "",
  "questions": [],
  "insight": "",
  "related_trajectories": []
}
```

**These contracts must not change in V1.**

---

## Contracts Authority Rule

```
backend/app/core/contracts.py  ← canonical source of truth
frontend/src/types/index.ts    ← TypeScript mirror, exact copy
```

`types/index.ts` must not introduce additional fields, rename fields, or change types independently. All changes originate in `contracts.py` first.

---

## Visible vs Invisible (V1)

```
Visible to users:
  ✓ Situation Card
  ✓ Star Map
  ✓ User reflection note (private, one per card)

Invisible — internal architecture only, never surfaces in UI or API:
  ✗ Camshaft Tree (Arbre à Cames)
  ✗ Astrolabe
  ✗ Anemos
  ✗ Fractal memory
  ✗ Vulnerability axis
  ✗ 10-level reasoning
```

These internal modules live **only in system prompts**. They must never appear in any API response, UI label, or frontend component.

---

## What Is NOT in V1

**Product:** team workspaces, developer API, custom templates, **public card comments**, card version history, mobile native app, real-time notifications, embedding/iframe, advanced search, image export.

> Note: **private user reflection notes (`card_notes`) ARE in V1.** One note per user per card. Private, never public. Not a comment system. This is distinct from public comments which are excluded.

**Architecture:** microservices, Redis, message queues/Celery, Kubernetes, multi-region, GraphQL, vector search, plugin system, internal theory exposed in UI, rate limiting beyond basic tier checks.

---

## Build Sequence

| Block | Scope |
|---|---|
| **Bloc 0** ✅ | Architecture alignment — this document |
| **Bloc 1** | Landing page (Next.js + Tailwind, no backend) |
| **Bloc 2** | Input layer + **frontend** generation flow |
| **Bloc 3** | **Backend** Situation Parsing Engine (AI) |
| **Bloc 4** | Situation Card rendering |
| **Bloc 5** | Star Map SVG component |
| **Bloc 6+** | Save · Share · Library · Accounts · Admin · Billing |

> **Bloc 2 vs Bloc 3 boundary:** Bloc 2 is everything the user sees and triggers (input field, loading state, card display shell). Bloc 3 is the backend engine that transforms text into a valid Situation Card JSON. They are built and tested independently.

---

## Builder Mode Rules (apply to every block)

1. Only implement the requested block.
2. Do not redesign the architecture.
3. Do not introduce new frameworks or libraries.
4. Do not modify existing JSON contracts.
5. Do not add features outside block scope.
6. Keep code minimal and readable.
7. **System must remain deployable after each block.**

---

## Quick Start (local)

```bash
cp .env.example .env
# fill .env values
docker compose up --build
```

Health check (via Nginx — not direct backend port):
```bash
curl http://localhost/api/health
# → {"status":"ok","version":"1.0.0"}
```

> Always test through `http://localhost` (port 80, via Nginx). Do not test directly against `backend:8000` — routing goes through Nginx in all environments.
