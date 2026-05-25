from functools import lru_cache
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


API_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = API_DIR.parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(REPO_ROOT / ".env", API_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ENCRYPTION_MASTER_SECRET: str
    ANTHROPIC_API_KEY: str = ""
    TAVILY_API_KEY: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_async_database_url(cls, value: str) -> str:
        if not isinstance(value, str):
            return value

        database_url = value
        if database_url.startswith("postgresql://"):
            database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

        if not database_url.startswith("postgresql+asyncpg://"):
            return database_url

        parsed = urlsplit(database_url)
        query = dict(parse_qsl(parsed.query, keep_blank_values=True))

        if "sslmode" in query and "ssl" not in query:
            query["ssl"] = query.pop("sslmode")

        # asyncpg does not accept psycopg-style channel_binding URL options.
        query.pop("channel_binding", None)

        return urlunsplit(
            (parsed.scheme, parsed.netloc, parsed.path, urlencode(query), parsed.fragment)
        )


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
