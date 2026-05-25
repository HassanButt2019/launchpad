import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.idea import Idea
from app.models.user import User
from app.schemas.idea import IdeaCreate, IdeaUpdate, IdeaResponse
from app.security.encryption import get_user_fernet, encrypt_field, decrypt_field
from app.config import settings


def _get_fernet(user: User):
    return get_user_fernet(
        user_id=str(user.id),
        salt=user.encryption_key_salt,
        master_secret=settings.ENCRYPTION_MASTER_SECRET,
        rsa_private_key_base64=settings.RSA_PRIVATE_KEY_BASE64,
    )


def _encrypt_idea_fields(idea: Idea, data: dict, fernet) -> None:
    if "description" in data and data["description"] is not None:
        idea.description_encrypted = encrypt_field(data["description"], fernet)
    if "target_audience" in data and data["target_audience"] is not None:
        idea.target_audience_encrypted = encrypt_field(data["target_audience"], fernet)
    if "problem_statement" in data and data["problem_statement"] is not None:
        idea.problem_statement_encrypted = encrypt_field(data["problem_statement"], fernet)
    if "unique_value_prop" in data and data["unique_value_prop"] is not None:
        idea.unique_value_prop_encrypted = encrypt_field(data["unique_value_prop"], fernet)


def _decrypt_idea(idea: Idea, fernet) -> IdeaResponse:
    def safe_decrypt(val):
        if val is None:
            return None
        try:
            return decrypt_field(val, fernet)
        except Exception:
            return None

    return IdeaResponse(
        id=idea.id,
        user_id=idea.user_id,
        title=idea.title,
        description=safe_decrypt(idea.description_encrypted),
        stage=idea.stage,
        market_size=idea.market_size,
        target_audience=safe_decrypt(idea.target_audience_encrypted),
        problem_statement=safe_decrypt(idea.problem_statement_encrypted),
        unique_value_prop=safe_decrypt(idea.unique_value_prop_encrypted),
        created_at=idea.created_at,
        updated_at=idea.updated_at,
    )


async def get_ideas(user: User, db: AsyncSession) -> List[IdeaResponse]:
    result = await db.execute(select(Idea).where(Idea.user_id == user.id).order_by(Idea.created_at.desc()))
    ideas = result.scalars().all()
    fernet = _get_fernet(user)
    return [_decrypt_idea(idea, fernet) for idea in ideas]


async def get_idea(idea_id: str, user: User, db: AsyncSession) -> IdeaResponse:
    idea = await _get_idea_or_404(idea_id, user.id, db)
    fernet = _get_fernet(user)
    return _decrypt_idea(idea, fernet)


async def create_idea(data: IdeaCreate, user: User, db: AsyncSession) -> IdeaResponse:
    fernet = _get_fernet(user)
    idea = Idea(
        id=str(uuid.uuid4()),
        user_id=user.id,
        title=data.title,
        stage=data.stage,
        market_size=data.market_size,
    )
    _encrypt_idea_fields(idea, data.model_dump(), fernet)
    db.add(idea)
    await db.flush()
    await db.refresh(idea)
    return _decrypt_idea(idea, fernet)


async def update_idea(idea_id: str, data: IdeaUpdate, user: User, db: AsyncSession) -> IdeaResponse:
    idea = await _get_idea_or_404(idea_id, user.id, db)
    fernet = _get_fernet(user)

    update_data = data.model_dump(exclude_none=True)
    if "title" in update_data:
        idea.title = update_data["title"]
    if "stage" in update_data:
        idea.stage = update_data["stage"]
    if "market_size" in update_data:
        idea.market_size = update_data["market_size"]

    _encrypt_idea_fields(idea, update_data, fernet)
    await db.flush()
    await db.refresh(idea)
    return _decrypt_idea(idea, fernet)


async def delete_idea(idea_id: str, user: User, db: AsyncSession) -> None:
    idea = await _get_idea_or_404(idea_id, user.id, db)
    await db.delete(idea)
    await db.flush()


async def _get_idea_or_404(idea_id: str, user_id: str, db: AsyncSession) -> Idea:
    result = await db.execute(
        select(Idea).where(Idea.id == idea_id, Idea.user_id == user_id)
    )
    idea = result.scalar_one_or_none()
    if idea is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Idea not found")
    return idea
