import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.user import UserCreate, TokenResponse, LoginRequest
from app.security.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
    blacklist_token,
    is_token_blacklisted,
)
from app.security.encryption import generate_salt


async def register_user(data: UserCreate, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.email == data.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    salt = generate_salt()
    user = User(
        id=str(uuid.uuid4()),
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        encryption_key_salt=salt,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def login_user(data: LoginRequest, db: AsyncSession) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == data.email, User.is_active == True))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


async def refresh_access_token(refresh_token: str) -> TokenResponse:
    if await is_token_blacklisted(refresh_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
        )

    payload = verify_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = payload.get("sub")
    new_access_token = create_access_token({"sub": user_id})
    new_refresh_token = create_refresh_token({"sub": user_id})

    await blacklist_token(refresh_token)

    return TokenResponse(access_token=new_access_token, refresh_token=new_refresh_token)


async def logout_user(access_token: str, refresh_token: Optional[str] = None) -> None:
    await blacklist_token(access_token)
    if refresh_token:
        await blacklist_token(refresh_token)
