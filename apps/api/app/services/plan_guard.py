"""
Subscription plan enforcement.

Single source of truth for tier limits. All AI-gated endpoints call these
guards before touching the Anthropic or Tavily APIs.
"""
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document, DocumentType
from app.models.idea import Idea
from app.models.conversation import ConversationMessage
from app.models.validation_report import ValidationReport
from app.models.user import User

# ---------------------------------------------------------------------------
# Tier definitions
# ---------------------------------------------------------------------------

_UNLIMITED = None

PLAN_LIMITS: dict[str, dict] = {
    "validate": {
        "max_ideas": 1,
        "max_chat_messages_per_idea": 5,       # user-sent messages, lifetime
        "max_validations_per_idea": 1,          # lifetime
        "allowed_doc_types": {DocumentType.PITCH_DECK},
        "market_research": False,
        "formation": False,
    },
    "build": {
        "max_ideas": 10,
        "max_chat_messages_per_idea": _UNLIMITED,
        "max_validations_per_idea": _UNLIMITED,
        "allowed_doc_types": set(DocumentType),
        "market_research": True,
        "formation": True,
    },
    "launch": {
        "max_ideas": _UNLIMITED,
        "max_chat_messages_per_idea": _UNLIMITED,
        "max_validations_per_idea": _UNLIMITED,
        "allowed_doc_types": set(DocumentType),
        "market_research": True,
        "formation": True,
    },
}

_UPGRADE_MSG = (
    "You've reached the limit of your {feature} on the free Validate plan. "
    "Upgrade to Build ($19/mo) to unlock more."
)


def _limits(user: User) -> dict:
    tier = getattr(user, "subscription_tier", "validate") or "validate"
    return PLAN_LIMITS.get(tier, PLAN_LIMITS["validate"])


def _upgrade(feature: str):
    raise HTTPException(
        status_code=status.HTTP_402_PAYMENT_REQUIRED,
        detail=_UPGRADE_MSG.format(feature=feature),
    )


# ---------------------------------------------------------------------------
# Guard functions — call these from routers before AI operations
# ---------------------------------------------------------------------------

async def guard_create_idea(user: User, db: AsyncSession) -> None:
    """Block idea creation when the user has hit their idea limit."""
    lim = _limits(user)
    if lim["max_ideas"] is _UNLIMITED:
        return
    result = await db.execute(
        select(func.count()).select_from(Idea).where(Idea.user_id == user.id)
    )
    count = result.scalar_one()
    if count >= lim["max_ideas"]:
        _upgrade(f"{lim['max_ideas']} idea" + ("s" if lim["max_ideas"] != 1 else ""))


async def guard_chat_message(user: User, idea_id: str, db: AsyncSession) -> None:
    """Block chat when the user has hit the per-idea message limit."""
    lim = _limits(user)
    if lim["max_chat_messages_per_idea"] is _UNLIMITED:
        return
    # expire_on_commit=False on the session means SQLAlchemy can serve cached
    # ORM objects, but a raw COUNT always hits the DB. Use execution_options to
    # skip the identity map entirely and ensure we read the latest committed rows.
    result = await db.execute(
        select(func.count())
        .select_from(ConversationMessage)
        .where(
            ConversationMessage.idea_id == idea_id,
            ConversationMessage.user_id == user.id,
            ConversationMessage.role == "user",
        )
        .execution_options(populate_existing=True)
    )
    count = result.scalar_one()
    if count >= lim["max_chat_messages_per_idea"]:
        _upgrade(f"{lim['max_chat_messages_per_idea']} AI chat messages per idea")


async def guard_validation(user: User, idea_id: str, db: AsyncSession) -> None:
    """Block validation runs when the per-idea lifetime limit is reached."""
    lim = _limits(user)
    if lim["max_validations_per_idea"] is _UNLIMITED:
        return
    result = await db.execute(
        select(func.count())
        .select_from(ValidationReport)
        .where(ValidationReport.idea_id == idea_id)
    )
    count = result.scalar_one()
    if count >= lim["max_validations_per_idea"]:
        _upgrade(f"{lim['max_validations_per_idea']} AI validation per idea")


def guard_document_type(user: User, doc_type: DocumentType) -> None:
    """Block document generation for types not allowed on the user's plan."""
    lim = _limits(user)
    if doc_type not in lim["allowed_doc_types"]:
        _upgrade(f"{doc_type.value} documents (Pitch Deck only on free plan)")


def guard_market_research(user: User) -> None:
    """Block market research for free-tier users."""
    if not _limits(user)["market_research"]:
        _upgrade("Market Research")


def guard_formation(user: User) -> None:
    """Block formation features for free-tier users."""
    if not _limits(user)["formation"]:
        _upgrade("Business Formation Navigator")
