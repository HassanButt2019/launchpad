import uuid
from datetime import datetime
from typing import List

from sqlalchemy import String, Boolean, DateTime, LargeBinary, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        server_default=text("gen_random_uuid()::text"),
        default=lambda: str(uuid.uuid4()),
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    subscription_tier: Mapped[str] = mapped_column(
        String(20), nullable=False, default="validate", server_default="validate"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        default=datetime.utcnow,
    )
    encryption_key_salt: Mapped[bytes] = mapped_column(LargeBinary(16), nullable=False)

    ideas: Mapped[List["Idea"]] = relationship("Idea", back_populates="user", cascade="all, delete-orphan")
