"""
AI Co-Founder Chat service.

Streams Claude responses as Server-Sent Events, persists the full conversation
history, and injects rich idea context into the system prompt so the AI acts
as an informed strategic co-founder for each specific idea.
"""
import json
import logging
import uuid
from typing import AsyncIterator, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.conversation import ConversationMessage
from app.models.idea import Idea
from app.models.user import User
from app.security.encryption import get_user_fernet, decrypt_field

logger = logging.getLogger(__name__)

# How many prior messages to include in the Claude context window.
# 40 messages ≈ ~8–12k tokens of history — a good balance of memory vs cost.
_HISTORY_LIMIT = 40


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_fernet(user: User):
    return get_user_fernet(
        user_id=str(user.id),
        salt=user.encryption_key_salt,
        master_secret=settings.ENCRYPTION_MASTER_SECRET,
    )


def _safe_decrypt(value, fernet) -> str:
    if not value:
        return ""
    try:
        return decrypt_field(value, fernet)
    except Exception:
        return ""


async def _load_idea_context(idea_id: str, user: User, db: AsyncSession) -> dict:
    """Fetch idea + related data and return a plain dict of decrypted context."""
    from sqlalchemy.orm import selectinload
    from app.models.document import Document
    from app.models.formation import FormationProfile
    from app.models.validation_report import ValidationReport

    # Idea
    result = await db.execute(
        select(Idea).where(Idea.id == idea_id, Idea.user_id == user.id)
    )
    idea = result.scalar_one_or_none()
    if idea is None:
        return {}

    fernet = _get_fernet(user)

    ctx: dict = {
        "title":              idea.title,
        "description":        _safe_decrypt(idea.description_encrypted, fernet),
        "problem":            _safe_decrypt(idea.problem_statement_encrypted, fernet),
        "audience":           _safe_decrypt(idea.target_audience_encrypted, fernet),
        "uvp":                _safe_decrypt(idea.unique_value_prop_encrypted, fernet),
        "market_size":        idea.market_size or "Not specified",
        "stage":              idea.stage.value,
        "validation":         None,
        "documents":          [],
        "formation":          None,
    }

    # Latest validation report
    val_result = await db.execute(
        select(ValidationReport)
        .where(ValidationReport.idea_id == idea_id)
        .order_by(ValidationReport.generated_at.desc())
        .limit(1)
    )
    report = val_result.scalar_one_or_none()
    if report:
        ctx["validation"] = {
            "score":           report.score,
            "strengths":       report.strengths or [],
            "weaknesses":      report.weaknesses or [],
            "recommendations": report.recommendations or [],
        }

    # Generated documents
    doc_result = await db.execute(
        select(Document.doc_type, Document.status)
        .where(Document.idea_id == idea_id)
    )
    ctx["documents"] = [{"type": row.doc_type, "status": row.status} for row in doc_result]

    # Formation profile
    fp_result = await db.execute(
        select(FormationProfile)
        .where(FormationProfile.idea_id == idea_id)
        .limit(1)
    )
    fp = fp_result.scalar_one_or_none()
    if fp:
        ctx["formation"] = {
            "jurisdiction":    fp.jurisdiction,
            "legal_structure": fp.legal_structure,
            "status":          fp.status,
        }

    return ctx


def _build_system_prompt(ctx: dict) -> str:
    if not ctx:
        return (
            "You are an AI co-founder assistant. Help the founder think through "
            "their startup idea strategically."
        )

    val_section = ""
    if ctx.get("validation"):
        v = ctx["validation"]
        strengths  = "\n".join(f"  • {s}" for s in v["strengths"][:4])
        weaknesses = "\n".join(f"  • {w}" for w in v["weaknesses"][:4])
        val_section = f"""
VALIDATION SCORE: {v['score']}/100
Strengths:
{strengths}
Weaknesses:
{weaknesses}"""

    docs_section = ""
    if ctx.get("documents"):
        docs_section = "\nGENERATED DOCUMENTS: " + ", ".join(
            d["type"] for d in ctx["documents"]
        )

    formation_section = ""
    if ctx.get("formation"):
        f = ctx["formation"]
        formation_section = (
            f"\nFORMATION: {f['jurisdiction']} {f['legal_structure']} — {f['status']}"
        )

    return f"""You are the AI co-founder and strategic advisor for this specific startup. \
You have deep knowledge of every aspect of this idea and act as a thoughtful, direct, \
and experienced co-founder — not a generic assistant.

== IDEA CONTEXT ==
Name: {ctx['title']}
Stage: {ctx['stage']}
Description: {ctx['description']}
Problem being solved: {ctx['problem']}
Target audience: {ctx['audience']}
Unique value proposition: {ctx['uvp']}
Market size: {ctx['market_size']}{val_section}{docs_section}{formation_section}

== YOUR ROLE ==
- Give specific, actionable advice tailored to THIS idea — never generic startup platitudes
- Be direct and honest, including when the founder's thinking has gaps
- Reference the idea's actual details in your responses
- When asked to draft content (emails, docs, pitches), produce complete, usable drafts
- Keep responses concise unless the founder asks for depth
- Use markdown for structure when helpful (headers, bullet points, bold)"""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def get_messages(
    idea_id: str,
    user: User,
    db: AsyncSession,
    limit: int = 100,
    before_id: Optional[str] = None,
) -> list[ConversationMessage]:
    """Return paginated message history for a conversation."""
    q = (
        select(ConversationMessage)
        .where(
            ConversationMessage.idea_id == idea_id,
            ConversationMessage.user_id == user.id,
        )
        .order_by(ConversationMessage.created_at.desc())
        .limit(limit)
    )
    if before_id:
        # Cursor-based pagination: fetch messages older than before_id
        cursor_result = await db.execute(
            select(ConversationMessage.created_at).where(ConversationMessage.id == before_id)
        )
        cursor_ts = cursor_result.scalar_one_or_none()
        if cursor_ts:
            q = q.where(ConversationMessage.created_at < cursor_ts)

    result = await db.execute(q)
    msgs = result.scalars().all()
    # Return in chronological order (oldest first for display)
    return list(reversed(msgs))


async def clear_messages(idea_id: str, user: User, db: AsyncSession) -> int:
    """Delete all messages for this idea/user. Returns count deleted."""
    from sqlalchemy import delete
    result = await db.execute(
        delete(ConversationMessage).where(
            ConversationMessage.idea_id == idea_id,
            ConversationMessage.user_id == user.id,
        )
    )
    await db.commit()
    return result.rowcount


async def stream_chat_response(
    idea_id: str,
    content: str,
    user: User,
    db: AsyncSession,
) -> AsyncIterator[str]:
    """
    Save the user message, stream the Claude response as SSE, then persist
    the completed assistant message.

    Yields SSE-formatted strings:
      data: {"type": "chunk", "content": "..."}\\n\\n
      data: {"type": "done",  "message_id": "..."}\\n\\n
      data: {"type": "error", "message":   "..."}\\n\\n
    """
    import anthropic

    # ── 1. Persist user message ──
    # Free-tier: save user messages only (for quota counting); skip assistant messages.
    # Paid tiers: save full conversation for history.
    persist_assistant = getattr(user, "subscription_tier", "validate") != "validate"
    user_msg_id = str(uuid.uuid4())
    user_msg = ConversationMessage(
        id=user_msg_id,
        idea_id=idea_id,
        user_id=str(user.id),
        role="user",
        content=content.strip(),
    )
    db.add(user_msg)
    # Commit immediately so the quota count is durable before streaming starts.
    # Without this, the count is only flushed (not committed) until the stream
    # completes — meaning rapid requests or abandoned streams leave the guard
    # reading a stale count and allowing over-quota messages through.
    await db.commit()

    # ── 2. Load context & history ──
    ctx = await _load_idea_context(idea_id, user, db)
    system_prompt = _build_system_prompt(ctx)

    if persist_assistant:
        history_result = await db.execute(
            select(ConversationMessage)
            .where(
                ConversationMessage.idea_id == idea_id,
                ConversationMessage.user_id == user.id,
                ConversationMessage.id != user_msg_id,
            )
            .order_by(ConversationMessage.created_at.desc())
            .limit(_HISTORY_LIMIT)
        )
        history = list(reversed(history_result.scalars().all()))
    else:
        history = []  # free tier: no history, each message is stateless

    # Build message list: history + current user message
    messages = [{"role": m.role, "content": m.content} for m in history]
    messages.append({"role": "user", "content": content.strip()})

    # ── 3. Stream from Claude ──
    assistant_id = str(uuid.uuid4())
    accumulated = ""

    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            system=system_prompt,
            messages=messages,
        ) as stream:
            for text_chunk in stream.text_stream:
                accumulated += text_chunk
                yield f"data: {json.dumps({'type': 'chunk', 'content': text_chunk})}\n\n"

        # ── 4. Persist assistant message (paid tiers only) ──
        if persist_assistant:
            assistant_msg = ConversationMessage(
                id=assistant_id,
                idea_id=idea_id,
                user_id=str(user.id),
                role="assistant",
                content=accumulated,
            )
            db.add(assistant_msg)
            await db.commit()

        yield f"data: {json.dumps({'type': 'done', 'message_id': assistant_id})}\n\n"

    except Exception as exc:
        logger.exception("Chat stream error for idea %s: %s", idea_id, exc)
        yield f"data: {json.dumps({'type': 'error', 'message': 'AI response failed. Please try again.'})}\n\n"
