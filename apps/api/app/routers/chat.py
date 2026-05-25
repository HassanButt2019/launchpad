from typing import List, Optional

from fastapi import APIRouter, Depends, Request, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services import chat_service
from app.services import plan_guard
from app.security.middleware import limiter

router = APIRouter(prefix="/ideas", tags=["chat"])


class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)


class ChatMessageResponse(BaseModel):
    id: str
    idea_id: str
    role: str
    content: str
    created_at: str

    class Config:
        from_attributes = True


@router.get("/{idea_id}/chat", response_model=List[ChatMessageResponse])
@limiter.limit("60/minute")
async def get_chat_history(
    request: Request,
    idea_id: str,
    before_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return paginated conversation history (100 most recent messages)."""
    messages = await chat_service.get_messages(
        idea_id=idea_id,
        user=current_user,
        db=db,
        limit=100,
        before_id=before_id,
    )
    return [
        ChatMessageResponse(
            id=m.id,
            idea_id=m.idea_id,
            role=m.role,
            content=m.content,
            created_at=m.created_at.isoformat(),
        )
        for m in messages
    ]


@router.post("/{idea_id}/chat/stream")
@limiter.limit("30/minute")
async def stream_chat_message(
    request: Request,
    idea_id: str,
    data: ChatMessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send a message and stream the AI response as Server-Sent Events.

    Event format:
      data: {"type": "chunk",   "content": "..."}
      data: {"type": "done",    "message_id": "..."}
      data: {"type": "error",   "message": "..."}
    """
    await plan_guard.guard_chat_message(current_user, idea_id, db)
    if not settings_check():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured.",
        )

    return StreamingResponse(
        chat_service.stream_chat_response(
            idea_id=idea_id,
            content=data.content,
            user=current_user,
            db=db,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",   # disable Nginx buffering
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.delete("/{idea_id}/chat", status_code=204)
@limiter.limit("10/minute")
async def clear_chat_history(
    request: Request,
    idea_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete all messages in a conversation."""
    await chat_service.clear_messages(idea_id=idea_id, user=current_user, db=db)


def settings_check() -> bool:
    from app.config import settings
    return bool(settings.ANTHROPIC_API_KEY and settings.ANTHROPIC_API_KEY != "your-anthropic-api-key-here")
