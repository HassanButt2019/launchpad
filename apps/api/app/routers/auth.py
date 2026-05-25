from typing import Optional

from fastapi import APIRouter, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.user import UserCreate, UserResponse, TokenResponse, LoginRequest, RefreshRequest
from app.services import auth_service
from app.security.middleware import limiter
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])
bearer_scheme = HTTPBearer(auto_error=False)


@router.post("/register", response_model=UserResponse, status_code=201)
@limiter.limit("10/minute")
async def register(request: Request, data: UserCreate, db: AsyncSession = Depends(get_db)):
    user = await auth_service.register_user(data, db)
    return UserResponse.model_validate(user)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("20/minute")
async def login(request: Request, data: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.login_user(data, db)


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("30/minute")
async def refresh(request: Request, data: RefreshRequest):
    return await auth_service.refresh_access_token(data.refresh_token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post("/logout", status_code=204)
async def logout(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    data: Optional[RefreshRequest] = None,
):
    access_token = credentials.credentials if credentials else None
    refresh_token = data.refresh_token if data else None
    if access_token:
        await auth_service.logout_user(access_token, refresh_token)
