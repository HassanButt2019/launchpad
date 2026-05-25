# Feature 07 — Financial Model Builder

**Priority:** 7 of 13 | **Effort:** Medium | **Impact:** ⚡ High

## What It Is
An interactive AI-powered financial model. The founder inputs a handful of assumptions (price, conversion rate, monthly growth), and AI generates a 3-year P&L, cash flow, runway estimate, and break-even analysis. Any cell can be explained or improved by asking AI.

## Why It Matters
- Investors always ask "show me your financials" — founders usually have none
- Excel models are intimidating; an AI-guided builder removes that barrier
- Deeply integrated with the idea's context (revenue model from business plan, market from research)
- Creates a premium, high-stickiness feature

## User Inputs (simple form)
```
Pricing model: [Subscription / One-time / Usage / Freemium]
Monthly price per customer: $___
Expected monthly website visitors (year 1): ___
Visitor → trial conversion rate: ___%
Trial → paid conversion rate: ___%
Monthly churn rate: ___%
Monthly growth rate (visitors): ___%
Avg. monthly fixed costs (team + infra): $___
Customer acquisition cost (paid channels): $___
```

## AI-Generated Outputs

### Monthly Projections Table (36 months)
| Month | Visitors | Trials | Paid Users | MRR | Costs | Net |
|-------|----------|--------|------------|-----|-------|-----|

### Key Metrics Dashboard
- MRR at Month 12 / 24 / 36
- Break-even month
- Total funding needed (cash burn before profitability)
- LTV / CAC ratio
- Payback period

### Scenario Analysis
- Conservative (50% of base assumptions)
- Base (your inputs)
- Optimistic (150% of base)

## Architecture

### Backend
**New model: `FinancialModel`**
```python
class FinancialModel(Base):
    id: str
    idea_id: str
    assumptions: JSON          # input parameters
    monthly_projections: JSON  # 36 rows
    summary_metrics: JSON      # key metrics
    scenarios: JSON            # 3 scenarios
    ai_commentary: str         # Claude's narrative analysis
    created_at: datetime
```

**New service: `financial_service.py`**
- `build_model(idea_id, assumptions)`:
  1. Calculate projections deterministically (pure math, no AI)
  2. Ask Claude to review assumptions against industry benchmarks
  3. Claude writes narrative commentary ("Your CAC of $45 is reasonable for B2B SaaS…")
  4. Flag unrealistic assumptions ("3% monthly churn is high for enterprise software")
- `explain_metric(model_id, metric_name)`:
  - Claude explains what the metric means and how to improve it

### Frontend
**New page:** `/ideas/[id]/financial-model`

Layout:
- Left: Assumptions form (sticky)
- Right: Live-updating projections (recalculate on input change)
- Bottom: 3 charts — MRR growth, cash position, user growth
- "Ask AI" floating button — explain any metric or get improvement advice
- Export to CSV button

## Files to Create
- `apps/api/app/models/financial_model.py`
- `apps/api/app/services/financial_service.py`
- `apps/api/app/routers/financial.py`
- `apps/web/src/app/(dashboard)/ideas/[id]/financial-model/page.tsx`
- `apps/web/src/components/financial/AssumptionsForm.tsx`
- `apps/web/src/components/financial/ProjectionsTable.tsx`
- `apps/web/src/components/financial/MetricsDashboard.tsx`

## Estimated Dev Time
5–6 days
