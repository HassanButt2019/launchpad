import uuid
from datetime import datetime
from typing import Optional, List
import enum

from sqlalchemy import String, ForeignKey, DateTime, Enum, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class IdeaStage(str, enum.Enum):
    DRAFT = "DRAFT"
    VALIDATING = "VALIDATING"
    VALIDATED = "VALIDATED"
    BUILDING = "BUILDING"
    INCORPORATED = "INCORPORATED"


class Idea(Base):
    __tablename__ = "ideas"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        server_default=text("gen_random_uuid()::text"),
        default=lambda: str(uuid.uuid4()),
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description_encrypted: Mapped[Optional[str]] = mapped_column(String(10000), nullable=True)
    stage: Mapped[IdeaStage] = mapped_column(
        Enum(IdeaStage), default=IdeaStage.DRAFT, nullable=False
    )
    market_size: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    target_audience_encrypted: Mapped[Optional[str]] = mapped_column(String(5000), nullable=True)
    problem_statement_encrypted: Mapped[Optional[str]] = mapped_column(String(5000), nullable=True)
    unique_value_prop_encrypted: Mapped[Optional[str]] = mapped_column(String(5000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        default=datetime.utcnow,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    user: Mapped["User"] = relationship("User", back_populates="ideas")
    validation_reports: Mapped[List["ValidationReport"]] = relationship(
        "ValidationReport", back_populates="idea", cascade="all, delete-orphan"
    )
    documents: Mapped[List["Document"]] = relationship(
        "Document", back_populates="idea", cascade="all, delete-orphan"
    )
    checklists: Mapped[List["Checklist"]] = relationship(
        "Checklist", back_populates="idea", cascade="all, delete-orphan"
    )
    formation_profiles: Mapped[List["FormationProfile"]] = relationship(
        "FormationProfile", back_populates="idea", cascade="all, delete-orphan"
    )
