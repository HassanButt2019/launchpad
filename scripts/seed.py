"""Demo seed script: creates a demo user and 2 sample ideas."""
import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'apps', 'api'))

from app.database import AsyncSessionLocal, engine
from app.database import Base
from app.models import User, Idea
from app.security.auth import get_password_hash
from app.security.encryption import get_user_fernet, encrypt_field, generate_salt
from app.config import settings
import uuid

DEMO_EMAIL = "demo@launchpad.dev"
DEMO_PASSWORD = "Demo1234!"
DEMO_SUBSCRIPTION_TIER = "launch"


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        from sqlalchemy import select

        result = await db.execute(select(User).where(User.email == DEMO_EMAIL))
        user = result.scalar_one_or_none()

        if not user:
            salt = generate_salt()
            user = User(
                id=str(uuid.uuid4()),
                email=DEMO_EMAIL,
                hashed_password=get_password_hash(DEMO_PASSWORD),
                full_name="Demo Founder",
                subscription_tier=DEMO_SUBSCRIPTION_TIER,
                encryption_key_salt=salt,
            )
            db.add(user)
            await db.flush()
            print(f"Created user: {DEMO_EMAIL}")
        else:
            user.subscription_tier = DEMO_SUBSCRIPTION_TIER
            print(f"User already exists: {DEMO_EMAIL}")

        fernet = get_user_fernet(
            str(user.id),
            user.encryption_key_salt,
            settings.ENCRYPTION_MASTER_SECRET,
        )

        ideas_data = [
            {
                "title": "AI-powered code review for small teams",
                "description": "Automated code review tool that understands context and gives actionable feedback without enterprise pricing.",
                "stage": "VALIDATING",
                "market_size": "$4.2B",
                "target_audience": "Small engineering teams (2-15 devs) at seed-to-Series A startups",
                "problem_statement": "Small teams can't afford enterprise code review tools and rely on ad-hoc PR reviews that miss security issues.",
                "unique_value_prop": "Context-aware reviews with security focus at $29/month flat fee — no per-seat pricing.",
            },
            {
                "title": "Micro-learning platform for founders",
                "description": "5-minute daily lessons on fundraising, GTM, and product, curated by successful founders.",
                "stage": "DRAFT",
                "market_size": "$1.8B",
                "target_audience": "First-time founders and aspiring entrepreneurs aged 25-40",
                "problem_statement": "Founders waste weeks reading generic startup books instead of getting actionable, founder-tested advice.",
                "unique_value_prop": "Bite-sized lessons from real founders with verifiable outcomes, not generic advice.",
            },
        ]

        for idea_data in ideas_data:
            idea = Idea(
                id=str(uuid.uuid4()),
                user_id=str(user.id),
                title=idea_data["title"],
                description_encrypted=encrypt_field(idea_data["description"], fernet),
                stage=idea_data["stage"],
                market_size=idea_data["market_size"],
                target_audience_encrypted=encrypt_field(idea_data["target_audience"], fernet),
                problem_statement_encrypted=encrypt_field(idea_data["problem_statement"], fernet),
                unique_value_prop_encrypted=encrypt_field(idea_data["unique_value_prop"], fernet),
            )
            db.add(idea)

        await db.commit()
        print(f"Demo user: {DEMO_EMAIL} / {DEMO_PASSWORD}")
        print(f"Demo subscription tier: {DEMO_SUBSCRIPTION_TIER}")
        print(f"Created 2 sample ideas")


if __name__ == "__main__":
    asyncio.run(seed())
