import uuid
import logging
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from fastapi import HTTPException, status

from app.models.document import Document, DocumentType
from app.models.idea import Idea
from app.models.user import User
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentResponse, DocumentDetailResponse
from app.security.encryption import get_user_fernet, encrypt_field, decrypt_field
from app.config import settings

logger = logging.getLogger(__name__)

_DOC_PROMPTS = {
    DocumentType.PITCH_DECK: "Write an investor pitch deck in Markdown for this startup. Use real content, no placeholders. Sections: Problem, Solution, Market Opportunity, Business Model, Traction, Go-to-Market, Competitive Advantage, Team, The Ask. Be punchy.\n\nStartup: {title}\nProblem: {problem_statement}\nSolution: {description}\nAudience: {target_audience}\nMarket: {market_size}\nUVP: {unique_value_prop}",

    DocumentType.BUSINESS_PLAN: "Write a business plan in Markdown for this startup. Use real content, no placeholders. Sections: Executive Summary, Problem & Opportunity, Solution, Target Market, Competitive Analysis (table), Revenue Model, Go-to-Market, Financial Projections (Y1–Y3), Risks.\n\nStartup: {title}\nProblem: {problem_statement}\nSolution: {description}\nAudience: {target_audience}\nMarket: {market_size}\nUVP: {unique_value_prop}",

    DocumentType.MVP_SPEC: "Write an MVP specification in Markdown for this startup. Use real features, no placeholders. Sections: Overview, Success Criteria (KPIs), Core Features (must-have), Out of Scope, Top 5 User Stories, Tech Stack, 8-week Timeline, Risks.\n\nStartup: {title}\nProblem: {problem_statement}\nSolution: {description}\nAudience: {target_audience}\nMarket: {market_size}\nUVP: {unique_value_prop}",

    DocumentType.MARKET_RESEARCH: "Write a market research report in Markdown for this startup. Use real analysis, no placeholders. Sections: Market Overview, Target Segments (with size estimates), Customer Pain Points, Competitive Landscape (table of top 5 competitors with strengths/weaknesses), Market Trends, TAM/SAM/SOM estimates, Go-to-Market Opportunities.\n\nStartup: {title}\nProblem: {problem_statement}\nSolution: {description}\nAudience: {target_audience}\nMarket: {market_size}\nUVP: {unique_value_prop}",

    DocumentType.FINANCIAL_MODEL: "Write a financial model outline in Markdown for this startup. Use realistic numbers, no placeholders. Sections: Revenue Streams, Pricing Strategy, Unit Economics (CAC, LTV, LTV:CAC ratio estimates), Monthly Cost Structure, Year 1–3 Revenue Projections (table), Break-even Analysis, Funding Requirements.\n\nStartup: {title}\nProblem: {problem_statement}\nSolution: {description}\nAudience: {target_audience}\nMarket: {market_size}\nUVP: {unique_value_prop}",

    DocumentType.LEGAL_CHECKLIST: "Write a jurisdiction-specific legal checklist in Markdown for this startup incorporating in **{jurisdiction}**. Use real actionable items with checkboxes, no placeholders. Sections: Business Formation (exact entity type, registration steps, costs, timeline for {jurisdiction}), Intellectual Property (trademarks, patents — process for {jurisdiction}), Contracts Needed, Data Privacy & Compliance (laws applicable in {jurisdiction}), Employment & Contractor Agreements, Tax Registration & Obligations for {jurisdiction}, Regulatory Requirements for this industry in {jurisdiction}, Immediate Action Items (top 5 things to do first). Include official government portal links where relevant.\n\nStartup: {title}\nJurisdiction: {jurisdiction}\nProblem: {problem_statement}\nSolution: {description}\nAudience: {target_audience}\nMarket: {market_size}\nUVP: {unique_value_prop}",
}


def _get_fernet(user: User):
    return get_user_fernet(
        user_id=str(user.id),
        salt=user.encryption_key_salt,
        master_secret=settings.ENCRYPTION_MASTER_SECRET,
        rsa_private_key_base64=settings.RSA_PRIVATE_KEY_BASE64,
    )


def _safe_decrypt(val: Optional[str], fernet) -> str:
    if not val:
        return ""
    try:
        return decrypt_field(val, fernet)
    except Exception:
        return ""


async def _verify_idea_ownership(idea_id: str, user_id: str, db: AsyncSession) -> None:
    result = await db.execute(select(Idea).where(Idea.id == idea_id, Idea.user_id == user_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Idea not found")


async def _generate_with_claude(doc_type: DocumentType, idea: Idea, fernet, jurisdiction: str = "") -> str:
    import anthropic

    prompt_template = _DOC_PROMPTS.get(doc_type)
    if not prompt_template:
        return f"# {idea.title}\n\n[Document content goes here]"

    prompt = prompt_template.format(
        title=idea.title or "My Startup",
        problem_statement=_safe_decrypt(idea.problem_statement_encrypted, fernet) or "Not specified",
        description=_safe_decrypt(idea.description_encrypted, fernet) or "Not specified",
        target_audience=_safe_decrypt(idea.target_audience_encrypted, fernet) or "Not specified",
        market_size=idea.market_size or "Not specified",
        unique_value_prop=_safe_decrypt(idea.unique_value_prop_encrypted, fernet) or "Not specified",
        jurisdiction=jurisdiction or "Not specified",
    )

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


def _fallback_template(doc_type: DocumentType, idea: Idea) -> str:
    title = idea.title or "Your Startup"
    templates = {
        DocumentType.PITCH_DECK: f"# {title} — Pitch Deck\n\n## Problem\n[Add your problem statement]\n\n## Solution\n[Add your solution]\n\n## Market Opportunity\n- Market Size: {idea.market_size or 'TBD'}\n\n## Business Model\n[Add revenue model]\n\n## Team\n[Add team info]\n\n## The Ask\n[Add funding ask]",
        DocumentType.BUSINESS_PLAN: f"# {title} — Business Plan\n\n## Executive Summary\n[Add summary]\n\n## Problem & Solution\n[Add details]\n\n## Target Market\n- Size: {idea.market_size or 'TBD'}\n\n## Revenue Model\n[Add revenue model]\n\n## Financial Projections\n- Year 1: TBD\n- Year 2: TBD\n- Year 3: TBD",
        DocumentType.MVP_SPEC: f"# {title} — MVP Specification\n\n## Overview\n[Add overview]\n\n## Core Features\n1. [Feature 1]\n2. [Feature 2]\n3. [Feature 3]\n\n## Tech Stack\n- Frontend: [TBD]\n- Backend: [TBD]\n\n## Timeline\n- Week 1–2: Setup\n- Week 3–4: Core features\n- Week 5–6: Testing & launch",
        DocumentType.MARKET_RESEARCH: f"# {title} — Market Research\n\n## Market Overview\n[Add market overview]\n\n## Target Segments\n[Add segments]\n\n## Competitive Landscape\n[Add competitors]\n\n## TAM/SAM/SOM\n- TAM: {idea.market_size or 'TBD'}",
        DocumentType.FINANCIAL_MODEL: f"# {title} — Financial Model\n\n## Revenue Streams\n[Add revenue streams]\n\n## Pricing\n[Add pricing]\n\n## Projections\n- Year 1: TBD\n- Year 2: TBD\n- Year 3: TBD",
        DocumentType.LEGAL_CHECKLIST: f"# {title} — Legal Checklist\n\n## Business Formation\n- [ ] Choose entity type\n- [ ] Register company\n\n## IP Protection\n- [ ] Trademark name/logo\n\n## Contracts\n- [ ] Founder agreement\n- [ ] NDA template",
    }
    return templates.get(doc_type, f"# {title}\n\n[Start writing here]")


async def get_documents(idea_id: str, user: User, db: AsyncSession) -> List[DocumentResponse]:
    await _verify_idea_ownership(idea_id, user.id, db)
    result = await db.execute(
        select(Document).where(Document.idea_id == idea_id).order_by(Document.created_at.desc())
    )
    docs = result.scalars().all()
    return [DocumentResponse.model_validate(doc) for doc in docs]


async def create_document(
    idea_id: str, data: DocumentCreate, user: User, db: AsyncSession
) -> DocumentDetailResponse:
    await _verify_idea_ownership(idea_id, user.id, db)

    idea_result = await db.execute(select(Idea).where(Idea.id == idea_id))
    idea = idea_result.scalar_one_or_none()

    fernet = _get_fernet(user)

    if data.content is not None:
        content = data.content
    elif settings.ANTHROPIC_API_KEY and settings.ANTHROPIC_API_KEY != "your-anthropic-api-key-here":
        try:
            content = await _generate_with_claude(data.doc_type, idea, fernet, data.jurisdiction or "")
        except Exception as e:
            logger.error("Claude generation failed: %s", e)
            content = _fallback_template(data.doc_type, idea)
    else:
        content = _fallback_template(data.doc_type, idea)

    # Upsert — keep only one doc per type, delete any duplicates first
    existing = await db.execute(
        select(Document)
        .where(Document.idea_id == idea_id, Document.doc_type == data.doc_type)
        .order_by(Document.created_at.desc())
    )
    all_docs = existing.scalars().all()
    # Delete duplicates, keep the most recent
    if len(all_docs) > 1:
        ids_to_delete = [d.id for d in all_docs[1:]]
        await db.execute(delete(Document).where(Document.id.in_(ids_to_delete)))
    doc = all_docs[0] if all_docs else None

    if doc:
        doc.content_encrypted = encrypt_field(content, fernet)
        doc.version += 1
        doc.status = "draft"
    else:
        doc = Document(
            id=str(uuid.uuid4()),
            idea_id=idea_id,
            doc_type=data.doc_type,
            content_encrypted=encrypt_field(content, fernet),
            status="draft",
            version=1,
        )
        db.add(doc)

    await db.flush()
    await db.refresh(doc)
    return DocumentDetailResponse(
        id=doc.id,
        idea_id=doc.idea_id,
        doc_type=doc.doc_type,
        status=doc.status,
        version=doc.version,
        created_at=doc.created_at,
        content=content,
    )


async def get_document(idea_id: str, doc_id: str, user: User, db: AsyncSession) -> DocumentDetailResponse:
    await _verify_idea_ownership(idea_id, user.id, db)
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.idea_id == idea_id)
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    fernet = _get_fernet(user)
    try:
        content = decrypt_field(doc.content_encrypted, fernet)
    except Exception:
        content = None

    return DocumentDetailResponse(
        id=doc.id,
        idea_id=doc.idea_id,
        doc_type=doc.doc_type,
        status=doc.status,
        version=doc.version,
        created_at=doc.created_at,
        content=content,
    )


async def update_document(
    idea_id: str, doc_id: str, data: DocumentUpdate, user: User, db: AsyncSession
) -> DocumentDetailResponse:
    await _verify_idea_ownership(idea_id, user.id, db)
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.idea_id == idea_id)
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    fernet = _get_fernet(user)
    decrypted_content = None

    if data.content is not None:
        doc.content_encrypted = encrypt_field(data.content, fernet)
        doc.version += 1
        decrypted_content = data.content
    else:
        try:
            decrypted_content = decrypt_field(doc.content_encrypted, fernet)
        except Exception:
            decrypted_content = None

    if data.status is not None:
        doc.status = data.status

    await db.flush()
    await db.refresh(doc)
    return DocumentDetailResponse(
        id=doc.id,
        idea_id=doc.idea_id,
        doc_type=doc.doc_type,
        status=doc.status,
        version=doc.version,
        created_at=doc.created_at,
        content=decrypted_content,
    )
