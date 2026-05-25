# Feature 03 — Multi-Agent Validation Pipeline

**Priority:** 3 of 13 | **Effort:** Medium | **Impact:** 🔥 Critical

## What It Is
Replace the current single Claude call for validation with 4 specialist sub-agents running in parallel, each with a focused lens. An orchestrator agent synthesizes all findings into the final report. Scores become far more trustworthy and reports become far richer.

## Why It Matters
- Current validation is one prompt → one response — shallow and generic
- A single agent tries to evaluate market, competition, technical feasibility, AND financials simultaneously — none well
- Specialist agents produce dramatically deeper analysis per dimension
- Score confidence increases when 4 independent agents agree

## Agent Architecture

```
                    ┌─────────────────┐
                    │  Orchestrator   │
                    │     Agent       │
                    └────────┬────────┘
           ┌─────────────────┼─────────────────┐──────────────────┐
           ▼                 ▼                 ▼                  ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │    Market    │  │  Competition │  │  Technical   │  │  Financial   │
    │    Agent     │  │    Agent     │  │    Agent     │  │    Agent     │
    └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

### Sub-Agents

**1. Market Agent**
- Evaluates: TAM/SAM size, demand signals, problem urgency, market timing, customer willingness to pay
- Score weight: 30%
- Output: market_score (0-100), market_findings[], market_risks[]

**2. Competition Agent**
- Evaluates: competitive moat, differentiation strength, market gaps, incumbent threat, barrier to entry
- Score weight: 25%
- Output: competition_score, competitors[], moat_assessment, differentiation_score

**3. Technical Agent**
- Evaluates: build complexity, technical feasibility, team requirements, technology risk, time-to-MVP
- Score weight: 20%
- Output: technical_score, complexity_level, tech_risks[], mvp_timeline_estimate

**4. Financial Agent**
- Evaluates: revenue model clarity, unit economics viability, path to profitability, funding requirements, monetization strength
- Score weight: 25%
- Output: financial_score, revenue_model_assessment, unit_economics[], funding_needed

### Orchestrator Agent
- Receives all 4 sub-agent outputs
- Calculates weighted composite score
- Identifies the 3 biggest cross-cutting risks
- Generates prioritized action list
- Writes the executive summary

## Backend Changes

**Updated `ValidationReport` model:**
```python
# Add new columns
market_score: int
competition_score: int
technical_score: int
financial_score: int
sub_agent_outputs: JSON  # full outputs from each agent
```

**New `validation_service.py` functions:**
- `run_market_agent(idea)` → async
- `run_competition_agent(idea)` → async
- `run_technical_agent(idea)` → async
- `run_financial_agent(idea)` → async
- `run_orchestrator(idea, agent_outputs)` → async
- Use `asyncio.gather()` to run all 4 agents in parallel

**Claude model:** claude-haiku-4-5 for sub-agents (speed), claude-sonnet-4-6 for orchestrator (quality)

## Frontend Changes

**Updated validation report UI:**
- Radar/spider chart showing 4 dimension scores
- Expandable section per agent with detailed findings
- Score breakdown: "Market 78 · Competition 65 · Technical 82 · Financial 70 → Overall 74"
- Color-coded: green ≥75, amber 50-74, red <50

## Files to Modify
- `apps/api/app/services/validation_service.py` — full rewrite
- `apps/api/app/models/validation.py` — add sub-score columns
- `apps/web/src/app/(dashboard)/ideas/[id]/validate/page.tsx` — richer UI
- `apps/web/src/components/idea/ValidationScore.tsx` — add radar chart

## Estimated Dev Time
4–5 days
