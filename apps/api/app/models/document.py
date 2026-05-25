import uuid
from datetime import datetime
import enum

from sqlalchemy import String, Integer, ForeignKey, DateTime, Enum, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DocumentType(str, enum.Enum):
    PITCH_DECK = "PITCH_DECK"
    BUSINESS_PLAN = "BUSINESS_PLAN"
    MVP_SPEC = "MVP_SPEC"
    MARKET_RESEARCH = "MARKET_RESEARCH"
    FINANCIAL_MODEL = "FINANCIAL_MODEL"
    LEGAL_CHECKLIST = "LEGAL_CHECKLIST"


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        server_default=text("gen_random_uuid()::text"),
        default=lambda: str(uuid.uuid4()),
    )
    idea_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ideas.id", ondelete="CASCADE"), nullable=False, index=True
    )
    doc_type: Mapped[DocumentType] = mapped_column(Enum(DocumentType), nullable=False)
    content_encrypted: Mapped[str] = mapped_column(String(100000), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        default=datetime.utcnow,
    )

    idea: Mapped["Idea"] = relationship("Idea", back_populates="documents")
