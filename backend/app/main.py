from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

# ── Model registration (import ensures SQLAlchemy metadata is populated) ──────
import app.models.user        # noqa: F401
import app.models.card        # noqa: F401
import app.models.usage_event  # noqa: F401  Pre-Admin A
import app.models.admin_action # noqa: F401  Pre-Admin B

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="IAAA API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[f"https://{settings.DOMAIN}"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
from app.api.routes import generate as generate_router

# Bloc 2/3: POST /api/generate
app.include_router(generate_router.router, prefix="/api")

# Bloc 5: POST /api/explore  (mock placeholder — real engine in Bloc 6+)
from app.api.routes import explore as explore_router
app.include_router(explore_router.router, prefix="/api")

# Bloc 6A: auth
from app.api.routes import auth as auth_router
app.include_router(auth_router.router, prefix="/api")

# Bloc 6B: cards (save, list, fetch)
from app.api.routes import cards as cards_router
app.include_router(cards_router.router, prefix="/api")

# Bloc 8: public library
from app.api.routes import library as library_router
app.include_router(library_router.router, prefix="/api")

# Admin 1: admin dashboard + users read
from app.api.routes import admin as admin_router
app.include_router(admin_router.router, prefix="/api")

# Bloc 9+: notes · billing · admin

# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["infra"])
async def health():
    return {"status": "ok", "version": "1.0.0"}
