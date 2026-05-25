from datetime import datetime, timedelta, timezone
from typing import Optional, Any

from jose import JWTError, jwt
from passlib.context import CryptContext
import redis.asyncio as aioredis

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_redis_client: Optional[aioredis.Redis] = None


def get_redis() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


async def blacklist_token(token: str) -> None:
    redis = get_redis()
    try:
        payload = verify_token(token)
        if payload:
            exp = payload.get("exp")
            if exp:
                ttl = int(exp - datetime.now(timezone.utc).timestamp())
                if ttl > 0:
                    await redis.setex(f"blacklist:{token}", ttl, "1")
    except Exception:
        pass


async def is_token_blacklisted(token: str) -> bool:
    redis = get_redis()
    try:
        result = await redis.get(f"blacklist:{token}")
        return result is not None
    except Exception:
        return False
