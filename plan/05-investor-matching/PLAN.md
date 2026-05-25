# Feature 05 — Investor Matching & Outreach Generator

**Priority:** 5 of 13 | **Effort:** High | **Impact:** ⚡ High

## What It Is
After validation, AI analyzes the idea's stage, sector, geography, and funding needs, then matches it against a curated database of VCs and angels. For each match, it generates a personalized cold outreach email referencing the investor's actual portfolio and thesis.

## Why It Matters
- Fundraising is the hardest part of starting a company — founders waste months on wrong investors
- Personalized outreach 3–5x improves response rates vs generic emails
- This is a premium feature that can anchor a paid tier
- Creates a strong reason to keep using LaunchPad post-validation

## Architecture

### Investor Database
Curate a static JSON file of 300–500 investors with:
```json
{
  "id": "sequoia-capital",
  "name": "Sequoia Capital",
  "type": "VC",
  "stage": ["Seed", "Series A", "Series B"],
  "sectors": ["SaaS", "Fintech", "AI/ML", "Consumer"],
  "check_size_min": 1000000,
  "check_size_max": 15000000,
  "geography": ["US", "Global"],
  "portfolio_companies": ["Stripe", "Airbnb", "DoorDash"],
  "thesis": "We partner with outlier founders from idea to IPO",
  "partner_names": ["Roelof Botha", "Alfred Lin"],
  "website": "https://sequoiacap.com"
}
```

Source: Crunchbase, public investor pages, AngelList — compile once, update quarterly.

### Backend
**New model: `InvestorMatch`**
```python
class InvestorMatch(Base):
    id: str
    idea_id: str
    investor_id: str
    match_score: int          # 0-100
    match_reasons: JSON       # ["stage fit", "sector match", ...]
    outreach_email: str       # AI-generated personalized email
    status: str               # "matched" | "contacted" | "responded" | "passed"
    created_at: datetime
```

**New service: `investor_service.py`**
- `match_investors(idea, validation_report)`:
  1. Filter investors by stage compatibility (idea.stage)
  2. Filter by sector (Claude classifies idea sector)
  3. Score remaining investors on sector depth, geography, check size fit
  4. Return top 10 matches
- `generate_outreach_email(idea, investor)`:
  - Claude generates a 150-word personalized email referencing 1–2 portfolio companies, the investor's stated thesis, and why this idea fits

**New router: endpoints under `/api/v1/ideas/{id}/investors`**
- `GET /` — list matched investors with scores
- `POST /match` — trigger matching
- `POST /{investor_id}/email` — generate outreach email
- `PATCH /{investor_id}` — update status (contacted, responded, etc.)

### Frontend
**New page:** `/ideas/[id]/investors`

Layout:
- Matching score badge per investor
- Why matched: tags (sector, stage, geography)
- "Generate Email" button → shows the drafted email in a modal with copy button
- Status tracker: Matched → Emailed → Responded → Meeting → Pass
- CRM-like kanban view for tracking outreach

## Key Implementation Details
- Only show investor matching when validation score ≥ 60 (prevents premature fundraising)
- Email generation uses: idea context + investor portfolio + investor thesis
- Let users edit generated emails before marking as "contacted"
- Track response rates to improve matching over time

## Monetization Angle
- Free tier: 3 investor matches, no email generation
- Pro tier: All matches + personalized emails + CRM tracking
- This single feature justifies a $29/month subscription

## Files to Create
- `apps/api/app/data/investors.json`
- `apps/api/app/models/investor_match.py`
- `apps/api/app/services/investor_service.py`
- `apps/api/app/routers/investors.py`
- `apps/web/src/app/(dashboard)/ideas/[id]/investors/page.tsx`
- `apps/web/src/hooks/useInvestors.ts`

## Estimated Dev Time
5–7 days
