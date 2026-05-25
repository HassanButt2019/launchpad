# Feature 11 — Cohort Intelligence

**Priority:** 11 of 13 | **Effort:** High | **Impact:** 💡 Medium

## What It Is
Anonymized learning across all founders on the platform. The system surfaces aggregate insights from similar ideas: average validation scores by sector, common failure patterns, what attributes correlate with high scores, and how your idea benchmarks against the cohort.

## Why It Matters
- The platform gets smarter as more founders use it — network effects
- "Your score is above 73% of SaaS ideas in our network" is compelling social proof
- Surfaces non-obvious insights: "Ideas with B2C consumer focus score 18 points lower on average"
- Creates defensible competitive moat — competitors can't replicate this without users

## Data Architecture

### Analytics aggregates (no PII, no idea content)
```python
class IdeaAnalyticsSnapshot(Base):
    id: str
    # Anonymized attributes only
    sector: str                    # AI-classified
    target_market: str             # B2B / B2C / B2B2C
    stage: IdeaStage
    validation_score: int
    market_score: int
    competition_score: int
    technical_score: int
    financial_score: int
    jurisdiction: str              # if formed
    months_to_validated: int       # time from DRAFT to VALIDATED
    has_documents: bool
    has_formation: bool
    created_month: str             # YYYY-MM, not exact date
```

Only aggregate queries — never expose individual rows. Min cohort size = 10 before showing stats.

### AI Classification
When an idea is validated, a background job runs:
- Claude classifies the idea sector (SaaS / Fintech / Healthcare / Consumer / etc.)
- Saves anonymized snapshot to analytics table

## Insights Generated

**On validation completion:**
- "Your overall score (74) is above the median for B2B SaaS ideas (68)"
- "Your market score is in the top 25% for this sector"
- "Ideas like yours most commonly struggle with competitive moat — you scored 65 here"

**On the dashboard:**
- "LaunchPad founders with your profile take on average 3.2 months to get to Building stage"
- "The most validated sector this month: AI/ML tools"

**On the ideas list:**
- Industry benchmark badge next to each idea: "↑ above sector avg"

## Frontend Components

**`BenchmarkCard`** — shows on validation results page:
```
Your Score: 74
Sector Median: 68  ↑ above average
Top 25%: 85
Bottom 25%: 52
```

**`CohortInsights`** panel on dashboard:
- Top performing sectors this month
- Common failure patterns
- Your portfolio benchmarks

## Privacy Considerations
- Never expose content of other founders' ideas
- Minimum cohort size before showing stats (n ≥ 10)
- Opt-out toggle: "Don't include my ideas in platform analytics"
- No linking back to individual users

## Files to Create
- `apps/api/app/models/analytics.py`
- `apps/api/app/services/analytics_service.py`
- `apps/api/app/routers/analytics.py`
- `apps/web/src/components/idea/BenchmarkCard.tsx`
- `apps/web/src/components/dashboard/CohortInsights.tsx`

## Files to Modify
- `apps/api/app/services/validation_service.py` — trigger snapshot on validation complete

## Estimated Dev Time
6–8 days
