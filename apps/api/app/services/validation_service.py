"""
AI Validation service — replaces the mock random scorer.

Pipeline:
  1. Load & decrypt idea fields
  2. Run 4 targeted Tavily searches (market size, competitors, trends, funding)
     — skipped gracefully when TAVILY_API_KEY is absent
  3. Send everything to Claude with a strict JSON prompt
  4. Parse response, persist ValidationReport, advance idea stage
"""
import json
import logging
import uuid
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models.idea import Idea, IdeaStage
from app.models.validation_report import ValidationReport
from app.models.user import User
from app.schemas.validation_report import ValidationReportResponse
from app.security.encryption import get_user_fernet, decrypt_field
from app.tools.web_search import tavily_search

logger = logging.getLogger(__name__)

# Minimum score to advance stage to VALIDATED; below this stays VALIDATING
_VALIDATED_THRESHOLD = 50


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_fernet(user: User):
    return get_user_fernet(
        user_id=str(user.id),
        salt=user.encryption_key_salt,
        master_secret=settings.ENCRYPTION_MASTER_SECRET,
    )


def _safe_decrypt(value, fernet) -> str:
    if not value:
        return ""
    try:
        return decrypt_field(value, fernet)
    except Exception:
        return ""


def _build_idea_context(idea: Idea, fernet) -> dict:
    return {
        "title":       idea.title or "",
        "description": _safe_decrypt(idea.description_encrypted, fernet),
        "problem":     _safe_decrypt(idea.problem_statement_encrypted, fernet),
        "audience":    _safe_decrypt(idea.target_audience_encrypted, fernet),
        "uvp":         _safe_decrypt(idea.unique_value_prop_encrypted, fernet),
        "market_size": idea.market_size or "Not specified",
    }


async def _run_web_research(ctx: dict) -> List[dict]:
    """Fire 4 searches and return combined results. Silent on failure."""
    if not settings.TAVILY_API_KEY:
        return []

    queries = [
        f"{ctx['title']} market size TAM industry growth rate",
        f"top competitors alternatives to {ctx['title']} startup",
        f"{ctx['problem'][:120]} startup solutions funding 2024",
        f"{ctx['title']} target customers {ctx['audience'][:80]} pain points",
    ]

    all_results = []
    for query in queries:
        results = await tavily_search(query, settings.TAVILY_API_KEY, max_results=3)
        all_results.extend(results)

    return all_results


def _build_validation_prompt(ctx: dict, search_results: List[dict]) -> str:
    if search_results:
        lines = []
        for i, r in enumerate(search_results, 1):
            lines.append(f"[{i}] {r['title']} — {r['content'][:300]}\n    Source: {r['url']}")
        research_block = "\n\nWEB RESEARCH FINDINGS:\n" + "\n\n".join(lines)
    else:
        research_block = "\n\n(No live web data available — use training knowledge, label estimates clearly.)"

    return f"""You are a startup analyst at a top-tier VC firm. Evaluate this startup idea rigorously and return structured JSON.

STARTUP IDEA:
Name: {ctx['title']}
Problem: {ctx['problem'] or 'Not specified'}
Solution: {ctx['description'] or 'Not specified'}
Target audience: {ctx['audience'] or 'Not specified'}
Unique value proposition: {ctx['uvp'] or 'Not specified'}
Stated market size: {ctx['market_size']}{research_block}

SCORING RUBRIC (total 100 pts):
- Market opportunity & TAM size (25 pts)
- Problem clarity & pain severity (20 pts)
- Solution differentiation & defensibility (20 pts)
- Execution feasibility for a small team (20 pts)
- Market timing & tailwinds (15 pts)

Respond ONLY with valid JSON — no markdown fences, no extra text:
{{
  "score": <integer 0-100>,
  "score_rationale": "<1 sentence: what drives the score — cite specific evidence>",
  "market_opportunity": "<2-3 sentences: TAM estimate, growth rate, cite sources with [n] if available>",
  "competitive_landscape": "<3-5 sentences: name real competitors found in research, their funding/pricing, how this idea differentiates — be specific>",
  "strengths": [
    "<specific strength referencing this idea's actual title/problem/audience>",
    "<specific strength>",
    "<specific strength>"
  ],
  "weaknesses": [
    "<specific risk or gap — name real competitors or market dynamics if found>",
    "<specific weakness>",
    "<specific weakness>"
  ],
  "recommendations": [
    "<concrete, immediate next step specific to this idea — not generic>",
    "<concrete next step>",
    "<concrete next step>",
    "<concrete next step>"
  ],
  "sources": [
    "<URL from research if available>",
    "<URL>"
  ]
}}

Rules:
- strengths/weaknesses must each have exactly 3 items; recommendations exactly 4
- Name REAL companies from the research — never say "Company X" or "a competitor"
- score: 0-49 = weak, 50-64 = needs work, 65-79 = promising, 80-89 = strong, 90-100 = exceptional
- sources: include up to 5 URLs from web research; empty array if none available"""


def _parse_claude_response(text: str) -> dict:
    """Extract JSON from Claude's response, handling minor formatting issues."""
    text = text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(text)


def _fallback_result(ctx: dict) -> dict:
    """Used when Claude call fails — returns an honest placeholder."""
    return {
        "score": 55,
        "score_rationale": "Placeholder score — AI analysis was unavailable. Configure ANTHROPIC_API_KEY to get a real score.",
        "market_opportunity": f"Market size stated as {ctx['market_size']}. Independent validation required — configure TAVILY_API_KEY for live market data.",
        "competitive_landscape": "Competitive analysis unavailable — AI service not configured. Manually research direct and indirect competitors before proceeding.",
        "strengths": [
            f"'{ctx['title']}' addresses a clearly stated problem",
            "Target audience has been defined",
            "A unique value proposition has been articulated",
        ],
        "weaknesses": [
            "Market size claim has not been independently validated",
            "No competitive landscape analysis has been performed",
            "No evidence of customer discovery or demand signals yet",
        ],
        "recommendations": [
            "Configure ANTHROPIC_API_KEY in your .env to enable real AI validation",
            "Run 15 customer discovery interviews with your exact ICP before building",
            "Map the top 5 direct and indirect competitors with their pricing",
            "Build a landing page and collect 100 waitlist sign-ups to validate demand",
        ],
        "sources": [],
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def trigger_validation(
    idea_id: str, user: User, db: AsyncSession
) -> ValidationReportResponse:
    # ── 1. Load idea ──────────────────────────────────────────────────────
    result = await db.execute(
        select(Idea).where(Idea.id == idea_id, Idea.user_id == user.id)
    )
    idea = result.scalar_one_or_none()
    if idea is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Idea not found")

    # Mark as validating immediately
    idea.stage = IdeaStage.VALIDATING
    await db.flush()

    fernet = _get_fernet(user)
    ctx = _build_idea_context(idea, fernet)

    # ── 2. Web research ───────────────────────────────────────────────────
    search_results = await _run_web_research(ctx)
    logger.info(
        "Validation web research for idea %s: %d results",
        idea_id, len(search_results),
    )

    # ── 3. Claude analysis ────────────────────────────────────────────────
    ai_result: Optional[dict] = None

    if settings.ANTHROPIC_API_KEY and settings.ANTHROPIC_API_KEY != "your-anthropic-api-key-here":
        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            prompt = _build_validation_prompt(ctx, search_results)

            message = await client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}],
            )
            ai_result = _parse_claude_response(message.content[0].text)
        except Exception as exc:
            logger.exception("Claude validation failed for idea %s: %s", idea_id, exc)
            ai_result = _fallback_result(ctx)
    else:
        ai_result = _fallback_result(ctx)

    # ── 4. Advance stage ──────────────────────────────────────────────────
    score = int(ai_result.get("score", 55))
    idea.stage = IdeaStage.VALIDATED if score >= _VALIDATED_THRESHOLD else IdeaStage.VALIDATING

    # ── 5. Persist report (delete previous runs first) ────────────────────
    from sqlalchemy import delete as sa_delete
    await db.execute(
        sa_delete(ValidationReport).where(ValidationReport.idea_id == idea_id)
    )

    report = ValidationReport(
        id=str(uuid.uuid4()),
        idea_id=idea_id,
        score=score,
        score_rationale=ai_result.get("score_rationale", ""),
        strengths=ai_result.get("strengths", []),
        weaknesses=ai_result.get("weaknesses", []),
        recommendations=ai_result.get("recommendations", []),
        competitive_landscape=ai_result.get("competitive_landscape", ""),
        market_opportunity=ai_result.get("market_opportunity", ""),
        sources=ai_result.get("sources", []),
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)

    return ValidationReportResponse.model_validate(report)


async def get_validation_report(
    idea_id: str, user: User, db: AsyncSession
) -> ValidationReportResponse:
    result = await db.execute(
        select(Idea).where(Idea.id == idea_id, Idea.user_id == user.id)
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Idea not found")

    result = await db.execute(
        select(ValidationReport)
        .where(ValidationReport.idea_id == idea_id)
        .order_by(ValidationReport.generated_at.desc())
        .limit(1)
    )
    report = result.scalar_one_or_none()
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No validation report found")

    return ValidationReportResponse.model_validate(report)
