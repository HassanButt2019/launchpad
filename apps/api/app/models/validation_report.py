import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, ForeignKey, DateTime, JSON, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ValidationReport(Base):
    __tablename__ = "validation_reports"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        server_default=text("gen_random_uuid()::text"),
        default=lambda: str(uuid.uuid4()),
    )
    idea_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ideas.id", ondelete="CASCADE"), nullable=False, index=True
    )
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    score_rationale: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    strengths: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    weaknesses: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    recommendations: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    competitive_landscape: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    market_opportunity: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    sources: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        default=datetime.utcnow,
    )

    idea: Mapped["Idea"] = relationship("Idea", back_populates="validation_reports")
