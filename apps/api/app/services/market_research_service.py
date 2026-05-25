"""
Agentic Market Research service.

Phase 1 — Tool-use loop: Claude calls web_search up to MAX_SEARCHES times,
           gathering real market data, competitor info, and trend signals.
Phase 2 — Streaming synthesis: Claude turns the gathered evidence into a
           citation-backed markdown report that streams token-by-token.

When TAVILY_API_KEY is absent, Phase 1 is skipped; Claude synthesises from
its training knowledge with a clear caveat in the report header.
"""
import json
import logging
import uuid
from typing import AsyncIterator, Dict, Any, List, Optional

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.document import Document, DocumentType
from app.models.idea import Idea
from app.models.user import User
from app.security.encryption import get_user_fernet, encrypt_field, decrypt_field
from app.tools.web_search import tavily_search

logger = logging.getLogger(__name__)

MAX_SEARCHES = 8

_TOOL_DEFINITION = {
    "name": "web_search",
    "description": (
        "Search the web for real-world market data, competitor information, "
        "industry trends, funding rounds, or pricing intelligence."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Specific search query (be precise, include company/market names)",
            },
            "intent": {
                "type": "string",
                "enum": ["market_size", "competitor", "trend", "funding", "pricing", "customer"],
                "description": "What this search is trying to find",
            },
        },
        "required": ["query", "intent"],
    },
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _sse(event_dict: Dict[str, Any]) -> str:
    return f"data: {json.dumps(event_dict)}\n\n"


def _progress(step: str, message: str) -> str:
    return _sse({"type": "progress", "step": step, "message": message})


def _get_fernet(user: User):
    from app.security.encryption import get_user_fernet
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


async def _load_idea(idea_id: str, user: User, db: AsyncSession):
    result = await db.execute(
        select(Idea).where(Idea.id == idea_id, Idea.user_id == user.id)
    )
    return result.scalar_one_or_none()


def _build_idea_summary(idea: Idea, fernet) -> str:
    return (
        f"Startup: {idea.title}\n"
        f"Problem: {_safe_decrypt(idea.problem_statement_encrypted, fernet) or 'Not specified'}\n"
        f"Solution: {_safe_decrypt(idea.description_encrypted, fernet) or 'Not specified'}\n"
        f"Target audience: {_safe_decrypt(idea.target_audience_encrypted, fernet) or 'Not specified'}\n"
        f"Unique value proposition: {_safe_decrypt(idea.unique_value_prop_encrypted, fernet) or 'Not specified'}\n"
        f"Stated market size: {idea.market_size or 'Not specified'}"
    )


def _build_research_prompt(idea_summary: str) -> str:
    return (
        f"You are a market research analyst. Use the web_search tool to gather comprehensive, "
        f"real-world data about the following startup's market. Execute 6–8 targeted searches covering:\n"
        f"1. Total addressable market size and growth rate\n"
        f"2. Top 5–8 direct competitors (with funding, pricing, differentiators)\n"
        f"3. Latest industry trends and growth drivers\n"
        f"4. Target customer segments and pain points\n"
        f"5. Recent funding activity in this space\n\n"
        f"Startup context:\n{idea_summary}\n\n"
        f"Search strategically — be specific with queries to get useful data."
    )


def _build_synthesis_prompt(idea_summary: str, search_results: List[Dict]) -> str:
    has_data = bool(search_results)

    results_block = ""
    if has_data:
        formatted = []
        for i, r in enumerate(search_results, 1):
            formatted.append(
                f"[{i}] {r['title']}\n"
                f"    URL: {r['url']}\n"
                f"    {r['content']}"
            )
        results_block = "\n\nWEB RESEARCH FINDINGS:\n" + "\n\n".join(formatted)
    else:
        results_block = (
            "\n\n> Note: No live web data was retrieved. Use your training knowledge "
            "to produce estimates and analysis, and clearly label them as estimates."
        )

    return (
        f"You are a senior market research analyst. Write a comprehensive, "
        f"citation-backed market research report in Markdown for the startup below.\n\n"
        f"Startup context:\n{idea_summary}"
        f"{results_block}\n\n"
        f"REPORT STRUCTURE (use these exact headers):\n"
        f"# Market Research Report: [Startup Name]\n\n"
        f"## ⚡ Executive Summary\n"
        f"(3–4 sentences: market opportunity, key finding, recommendation)\n\n"
        f"## 📊 Market Size & TAM/SAM/SOM\n"
        f"(Real figures with sources; include TAM/SAM/SOM breakdown table)\n\n"
        f"## 📈 Market Trends & Growth Drivers\n"
        f"(5–7 bullet points with data; cite sources with [n] inline)\n\n"
        f"## 🏆 Competitive Landscape\n"
        f"(Markdown table: Company | Funding | Pricing | Key Differentiator | Weakness)\n"
        f"(Follow with 2–3 paragraphs of competitive analysis)\n\n"
        f"## 👥 Target Customer Analysis\n"
        f"(Segments, ICP, key pain points, willingness to pay)\n\n"
        f"## ⏱ Market Timing Assessment\n"
        f"(Why now? Tailwinds, regulatory shifts, tech enablers)\n\n"
        f"## 💡 Strategic Recommendations\n"
        f"(Top 3–5 numbered, specific, actionable)\n\n"
        f"## 🔗 Sources\n"
        f"(Numbered list matching inline citations; include URLs)\n\n"
        f"Rules:\n"
        f"- Use real data from the research findings; cite every statistic with [n]\n"
        f"- No placeholders — write actual numbers and company names\n"
        f"- Be direct and opinionated; founders need decisions, not hedging\n"
        f"- Use bold for key figures"
    )


async def _upsert_document(
    idea_id: str,
    user: User,
    content: str,
    db: AsyncSession,
) -> Document:
    fernet = _get_fernet(user)
    encrypted = encrypt_field(content, fernet)

    existing_result = await db.execute(
        select(Document)
        .where(Document.idea_id == idea_id, Document.doc_type == DocumentType.MARKET_RESEARCH)
        .order_by(Document.created_at.desc())
    )
    all_docs = existing_result.scalars().all()

    if len(all_docs) > 1:
        await db.execute(delete(Document).where(Document.id.in_([d.id for d in all_docs[1:]])))

    if all_docs:
        doc = all_docs[0]
        doc.content_encrypted = encrypted
        doc.version += 1
        doc.status = "ready"
    else:
        doc = Document(
            id=str(uuid.uuid4()),
            idea_id=idea_id,
            doc_type=DocumentType.MARKET_RESEARCH,
            content_encrypted=encrypted,
            status="ready",
            version=1,
        )
        db.add(doc)

    await db.flush()
    await db.refresh(doc)
    return doc


# ---------------------------------------------------------------------------
# Public streaming entry point
# ---------------------------------------------------------------------------

async def stream_market_research(
    idea_id: str,
    user: User,
    db: AsyncSession,
) -> AsyncIterator[str]:
    """
    Agentic market research pipeline.

    Yields SSE strings:
      progress  — step updates during research
      chunk     — streamed text tokens of the final report
      done      — {"doc_id": "..."}
      error     — {"message": "..."}
    """
    import anthropic

    # ── 1. Load idea ──────────────────────────────────────────────────────
    idea = await _load_idea(idea_id, user, db)
    if idea is None:
        yield _sse({"type": "error", "message": "Idea not found."})
        return

    fernet = _get_fernet(user)
    idea_summary = _build_idea_summary(idea, fernet)
    has_tavily = bool(settings.TAVILY_API_KEY)

    yield _progress("planning", "Planning research strategy…")

    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    all_search_results: List[Dict] = []

    # ── 2. Agentic tool-use loop (if Tavily configured) ───────────────────
    if has_tavily:
        messages: List[Dict] = [
            {"role": "user", "content": _build_research_prompt(idea_summary)}
        ]
        search_count = 0

        try:
            while search_count < MAX_SEARCHES:
                response = await client.messages.create(
                    model="claude-sonnet-4-6",
                    max_tokens=1024,
                    tools=[_TOOL_DEFINITION],
                    messages=messages,
                )

                # Append assistant turn to message history
                messages.append({"role": "assistant", "content": response.content})

                if response.stop_reason == "end_turn":
                    break

                if response.stop_reason != "tool_use":
                    break

                tool_results = []
                for block in response.content:
                    if block.type != "tool_use":
                        continue

                    query = block.input.get("query", "")
                    yield _progress("searching", f"Searching: {query[:70]}…")

                    results = await tavily_search(query, settings.TAVILY_API_KEY, max_results=5)
                    all_search_results.extend(results)
                    search_count += 1

                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(results),
                    })

                messages.append({"role": "user", "content": tool_results})

        except Exception as exc:
            logger.warning("Tool-use loop error: %s — falling back to synthesis", exc)

        yield _progress(
            "analyzing",
            f"Analysed {len(all_search_results)} sources. Building report…",
        )
    else:
        yield _progress(
            "analyzing",
            "No live search configured — generating from AI knowledge…",
        )

    # ── 3. Streaming synthesis ────────────────────────────────────────────
    yield _progress("synthesizing", "Generating your research report…")

    synthesis_prompt = _build_synthesis_prompt(idea_summary, all_search_results)
    accumulated = ""

    try:
        async with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            messages=[{"role": "user", "content": synthesis_prompt}],
        ) as stream:
            async for text in stream.text_stream:
                accumulated += text
                yield _sse({"type": "chunk", "content": text})

    except Exception as exc:
        logger.exception("Synthesis stream error: %s", exc)
        yield _sse({"type": "error", "message": "Report generation failed. Please try again."})
        await db.rollback()
        return

    # ── 4. Persist document ───────────────────────────────────────────────
    try:
        doc = await _upsert_document(idea_id, user, accumulated, db)
        await db.commit()
        yield _sse({"type": "done", "doc_id": doc.id})
    except Exception as exc:
        logger.exception("Failed to save market research doc: %s", exc)
        await db.rollback()
        yield _sse({"type": "error", "message": "Failed to save report. Please try again."})
