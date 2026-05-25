import uuid
from datetime import datetime
from typing import Optional, List

from sqlalchemy import String, ForeignKey, DateTime, Boolean, Integer, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FormationProfile(Base):
    __tablename__ = "formation_profiles"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        server_default=text("gen_random_uuid()::text"),
        default=lambda: str(uuid.uuid4()),
    )
    idea_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ideas.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    jurisdiction: Mapped[str] = mapped_column(String(100), nullable=False)
    legal_structure: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="PLANNING")
    incorporation_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
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

    idea: Mapped["Idea"] = relationship("Idea", back_populates="formation_profiles")
    checklist_items: Mapped[List["FormationChecklistItem"]] = relationship(
        "FormationChecklistItem", back_populates="formation", cascade="all, delete-orphan",
        order_by="FormationChecklistItem.sort_order",
    )
    documents: Mapped[List["FormationDocument"]] = relationship(
        "FormationDocument", back_populates="formation", cascade="all, delete-orphan"
    )
    compliance_events: Mapped[List["ComplianceEvent"]] = relationship(
        "ComplianceEvent", back_populates="formation", cascade="all, delete-orphan"
    )


class FormationChecklistItem(Base):
    __tablename__ = "formation_checklist_items"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        server_default=text("gen_random_uuid()::text"),
        default=lambda: str(uuid.uuid4()),
    )
    formation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("formation_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(String(2000), nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    can_ai_draft: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    official_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    estimated_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    formation: Mapped["FormationProfile"] = relationship(
        "FormationProfile", back_populates="checklist_items"
    )


class FormationDocument(Base):
    __tablename__ = "formation_documents"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        server_default=text("gen_random_uuid()::text"),
        default=lambda: str(uuid.uuid4()),
    )
    formation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("formation_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    doc_type: Mapped[str] = mapped_column(String(100), nullable=False)
    jurisdiction: Mapped[str] = mapped_column(String(100), nullable=False)
    content: Mapped[Optional[str]] = mapped_column(String(100000), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft")
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        default=datetime.utcnow,
    )

    formation: Mapped["FormationProfile"] = relationship(
        "FormationProfile", back_populates="documents"
    )


class ComplianceEvent(Base):
    __tablename__ = "compliance_events"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        server_default=text("gen_random_uuid()::text"),
        default=lambda: str(uuid.uuid4()),
    )
    formation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("formation_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(String(2000), nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    recurrence: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    reminder_sent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    formation: Mapped["FormationProfile"] = relationship(
        "FormationProfile", back_populates="compliance_events"
    )
