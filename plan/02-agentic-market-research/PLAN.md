# Feature 02 — Agentic Market Research

**Priority:** 2 of 13 | **Effort:** Medium | **Impact:** 🔥 Critical

## What It Is
Replace the current template-based Market Research document with a real web-connected research agent. It uses Claude's tool use to search the web, find real competitors, pull market size data, and generate a citation-backed report — not a form with placeholders.

## Why It Matters
- Current market research doc is a complete mock — it embarrasses the product
- Founders desperately need real market data, not placeholders
- This is the clearest way to show "AI that does real work"
- Directly improves the quality of validation scores (which currently have no market data)

## User Stories
- "Find real market size data for my idea's industry"
- "Who are the top 10 competitors in this space and what's their funding?"
- "What are the latest trends in my target market?"
- "Is this market growing or shrinking?"

## Architecture

### Backend
**New service: `market_research_service.py`**

Agent flow (multi-step Claude with tool use):
1. **Query planning** — Claude analyzes the idea and generates 4–6 targeted search queries
2. **Web search** — Execute searches using Brave Search API or Tavily (each result includes title, snippet, URL)
3. **Competitor discovery** — Claude extracts competitor names from results, runs targeted searches on each
4. **Synthesis** — Claude combines all gathered data into a structured report with citations

**Tool definitions for Claude:**
```python
tools = [
    {
        "name": "web_search",
        "description": "Search the web for market data, competitor info, or industry trends",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "intent": {"type": "string", "enum": ["market_size", "competitor", "trend", "funding"]}
            }
        }
    }
]
```

**Report structure (markdown):**
- Executive Summary
- Market Size & TAM/SAM/SOM (with citations)
- Market Trends & Growth Drivers
- Competitive Landscape (table: Company | Funding | Pricing | Differentiator)
- Target Customer Analysis
- Market Timing Assessment
- Sources

### External API needed
- **Tavily API** (best for AI agents) OR **Brave Search API** — both have free tiers
- Add `TAVILY_API_KEY` to `config.py`

### Frontend
- Replace the single "Generate" button on the Market Research card with a multi-step progress UI
- Show: "Planning searches… → Searching web… → Analyzing competitors… → Generating report…"
- Use SSE (Server-Sent Events) or polling with a job status endpoint

## Key Implementation Details
- Cache research results for 24h — market data doesn't change hourly
- Limit to 8 web searches per generation to control cost
- Include source URLs in the report with clickable links in the UI
- Use claude-sonnet-4-6 (not haiku) — web synthesis requires stronger reasoning

## Files to Create
- `apps/api/app/services/market_research_service.py`
- `apps/api/app/tools/web_search.py`
- `apps/web/src/components/documents/ResearchProgress.tsx`

## Files to Modify
- `apps/api/app/services/document_service.py` — route MARKET_RESEARCH to new service
- `apps/api/app/config.py` — add TAVILY_API_KEY

## Estimated Dev Time
3–4 days
