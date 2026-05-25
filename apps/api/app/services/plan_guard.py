"""
Subscription plan enforcement.

Single source of truth for tier limits. All AI-gated endpoints call these
guards before touching the Anthropic or Tavily APIs.
"""
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import DocumentType
from app.models.idea import Idea
from app.models.usage import UsageCounter
from app.models.user import User

# ---------------------------------------------------------------------------
# Tier definitions
# ---------------------------------------------------------------------------

_UNLIMITED = None

PLAN_LIMITS: dict[str, dict] = {
    "validate": {
        "max_ideas": _UNLIMITED,
        "max_chat_messages": 5,
        "max_validations": 1,
        "allowed_doc_types": {DocumentType.PITCH_DECK},
        "market_research": False,
        "formation": False,
    },
    "build": {
        "max_ideas": _UNLIMITED,
        "max_chat_messages": _UNLIMITED,
        "max_validations": _UNLIMITED,
        "allowed_doc_types": set(DocumentType),
        "market_research": True,
        "formation": True,
    },
    "launch": {
        "max_ideas": _UNLIMITED,
        "max_chat_messages": _UNLIMITED,
        "max_validations": _UNLIMITED,
        "allowed_doc_types": set(DocumentType),
        "market_research": True,
        "formation": True,
    },
}

_UPGRADE_MSG = (
    "You've reached the limit of your {feature} on the free Validate plan. "
    "Upgrade to the paid plan ($25/mo) to unlock more."
)


def _limits(user: User) -> dict:
    tier = getattr(user, "subscription_tier", "validate") or "validate"
    return PLAN_LIMITS.get(tier, PLAN_LIMITS["validate"])


def _upgrade(feature: str):
    raise HTTPException(
        status_code=status.HTTP_402_PAYMENT_REQUIRED,
        detail=_UPGRADE_MSG.format(feature=feature),
    )


async def _get_usage_count(user: User, feature: str, db: AsyncSession) -> int:
    result = await db.execute(
        select(UsageCounter).where(
            UsageCounter.user_id == user.id,
            UsageCounter.feature == feature,
        )
    )
    counter = result.scalar_one_or_none()
    return counter.count if counter else 0


async def _increment_usage(user: User, feature: str, db: AsyncSession) -> None:
    result = await db.execute(
        select(UsageCounter).where(
            UsageCounter.user_id == user.id,
            UsageCounter.feature == feature,
        )
    )
    counter = result.scalar_one_or_none()
    if counter is None:
        counter = UsageCounter(user_id=user.id, feature=feature, count=1)
        db.add(counter)
    else:
        counter.count += 1
    await db.flush()


async def _ensure_idea_exists(user: User, idea_id: str, db: AsyncSession) -> None:
    result = await db.execute(select(Idea.id).where(Idea.id == idea_id, Idea.user_id == user.id))
    if result.scalar_one_or_none() is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Idea not found")


# ---------------------------------------------------------------------------
# Guard functions — call these from routers before AI operations
# ---------------------------------------------------------------------------

async def guard_create_idea(user: User, db: AsyncSession) -> None:
    """Idea creation is unlimited for all plans."""
    return


async def guard_chat_message(user: User, idea_id: str, db: AsyncSession) -> None:
    """Block and record chat usage using a durable user-level counter."""
    await _ensure_idea_exists(user, idea_id, db)
    lim = _limits(user)
    if lim["max_chat_messages"] is _UNLIMITED:
        return
    count = await _get_usage_count(user, "ai_chat_message", db)
    if count >= lim["max_chat_messages"]:
        _upgrade(f"{lim['max_chat_messages']} AI chat messages")
    await _increment_usage(user, "ai_chat_message", db)


async def guard_validation(user: User, idea_id: str, db: AsyncSession) -> None:
    """Block and record validation usage using a durable user-level counter."""
    await _ensure_idea_exists(user, idea_id, db)
    lim = _limits(user)
    if lim["max_validations"] is _UNLIMITED:
        return
    count = await _get_usage_count(user, "ai_validation", db)
    if count >= lim["max_validations"]:
        _upgrade(f"{lim['max_validations']} AI validation")
    await _increment_usage(user, "ai_validation", db)


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
