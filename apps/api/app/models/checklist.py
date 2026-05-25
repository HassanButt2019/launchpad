import uuid
from datetime import datetime
import enum
from typing import Optional

from sqlalchemy import String, ForeignKey, DateTime, JSON, Enum, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ChecklistPhase(str, enum.Enum):
    VALIDATE = "VALIDATE"
    BUILD = "BUILD"
    LAUNCH = "LAUNCH"


class Checklist(Base):
    __tablename__ = "checklists"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        server_default=text("gen_random_uuid()::text"),
        default=lambda: str(uuid.uuid4()),
    )
    idea_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ideas.id", ondelete="CASCADE"), nullable=False, index=True
    )
    phase: Mapped[ChecklistPhase] = mapped_column(Enum(ChecklistPhase), nullable=False)
    items: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        default=datetime.utcnow,
    )

    idea: Mapped["Idea"] = relationship("Idea", back_populates="checklists")
