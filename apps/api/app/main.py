import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from sqlalchemy import text

from app.config import settings
from app.security.middleware import SecurityHeadersMiddleware, RequestIDMiddleware, limiter
from app.routers import auth, ideas, chat
from app.routers.formation import formation_router, ideas_formation_router

logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL, logging.INFO))
logger = logging.getLogger(__name__)


async def run_optional_ddl(engine, ddl: str) -> None:
    async with engine.connect() as conn:
        try:
            await conn.execute(text(ddl))
            await conn.commit()
        except Exception as exc:
            try:
                await conn.rollback()
            except Exception:
                pass
            logger.warning("Skipping optional startup migration: %s (%s)", ddl, exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("LaunchPad API starting up — environment: %s", settings.ENVIRONMENT)

    from app.database import engine, Base
    # Import all models so their metadata is registered before create_all
    import app.models  # noqa: F401

    # Optional dev migrations are isolated so one failure cannot abort startup.
    for ddl in [
        "CREATE EXTENSION IF NOT EXISTS pgcrypto",
        "ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid()::text",
        "ALTER TABLE users ALTER COLUMN id SET NOT NULL",
        "ALTER TABLE users ALTER COLUMN email SET NOT NULL",
        "ALTER TABLE users ALTER COLUMN hashed_password SET NOT NULL",
        "ALTER TABLE users ALTER COLUMN full_name SET NOT NULL",
        "ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id)",
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users(email)",
        "ALTER TYPE ideastage ADD VALUE IF NOT EXISTS 'INCORPORATED'",
        "ALTER TABLE ideas ALTER COLUMN market_size TYPE VARCHAR(200) USING market_size::text",
        "ALTER TABLE validation_reports ADD COLUMN IF NOT EXISTS score_rationale VARCHAR(500)",
        "ALTER TABLE validation_reports ADD COLUMN IF NOT EXISTS competitive_landscape VARCHAR(1000)",
        "ALTER TABLE validation_reports ADD COLUMN IF NOT EXISTS market_opportunity VARCHAR(500)",
        "ALTER TABLE validation_reports ADD COLUMN IF NOT EXISTS sources JSON",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) NOT NULL DEFAULT 'validate'",
        "ALTER TABLE validation_reports ALTER COLUMN score_rationale TYPE TEXT USING score_rationale::text",
        "ALTER TABLE validation_reports ALTER COLUMN competitive_landscape TYPE TEXT USING competitive_landscape::text",
        "ALTER TABLE validation_reports ALTER COLUMN market_opportunity TYPE TEXT USING market_opportunity::text",
    ]:
        await run_optional_ddl(engine, ddl)

    async with engine.begin() as conn:
        # Create any new tables (formation_profiles, formation_checklist_items, etc.)
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Database tables ensured")
    yield
    logger.info("LaunchPad API shutting down")


app = FastAPI(
    title="LaunchPad API",
    description="Startup idea validation platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — in dev allow any localhost port; in prod lock to FRONTEND_URL
_cors_origins = (
    [settings.FRONTEND_URL]
    if settings.ENVIRONMENT == "production"
    else [
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:3005",
    ]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)

# Custom middleware (added last = executes first)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(ideas.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(formation_router, prefix="/api/v1")
app.include_router(ideas_formation_router, prefix="/api/v1")


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}
