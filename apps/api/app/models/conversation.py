import uuid
from datetime import datetime

from sqlalchemy import String, Text, ForeignKey, DateTime, Index, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ConversationMessage(Base):
    __tablename__ = "conversation_messages"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    idea_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ideas.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)   # "user" | "assistant"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        default=datetime.utcnow,
    )

    idea: Mapped["Idea"] = relationship("Idea")  # no back_populates to keep it lightweight

    __table_args__ = (
        Index("ix_conv_idea_user_created", "idea_id", "user_id", "created_at"),
    )
