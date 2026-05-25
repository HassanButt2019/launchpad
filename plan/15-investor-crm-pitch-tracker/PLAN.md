# Feature 15 — Investor CRM & Pitch Tracker

**Priority:** 15 of 16 | **Effort:** Large | **Impact:** ⚡ High

## What It Is
A lightweight CRM for tracking fundraising activity per idea. Complements Feature 05 (Investor Matching) by adding a full pipeline tracker: manage investor contacts, track deal status on a Kanban board, draft cold emails with AI, and monitor round progress.

> **Relationship to Feature 05:** Feature 05 *finds and matches* investors. Feature 15 *tracks the relationship* after that first match — it's the CRM layer on top of the matching engine.

## Why It Matters
- Validated ideas have no fundraising workflow in the app today
- Founders currently juggle Notion, Airtable, and spreadsheets for investor tracking
- Keeping fundraising in-app alongside the idea means all context is in one place
- Personalised AI emails dramatically improve cold outreach response rates

## User Stories
- "Show me all investors I've contacted for this idea and their status"
- "Draft a cold email to this VC based on their portfolio and my idea"
- "I had a meeting with Andreessen — mark them as 'Meeting Done', add notes"
- "How much of my $500k target have I soft-circled so far?"

## Architecture

### Backend

**New model: `InvestorContact`**
```python
class InvestorContact(Base):
    id: str
    idea_id: str
    user_id: str
    name: str
    firm: str
    email: Optional[str]
    linkedin_url: Optional[str]
    thesis: Optional[str]           # their stated investment thesis
    check_size: Optional[str]       # e.g. "$250k–$1M"
    stage: str                      # pipeline stage enum
    notes: Optional[str]
    follow_up_date: Optional[date]
    created_at: datetime
    updated_at: datetime

class InvestorStage(str, Enum):
    TARGET = "TARGET"
    CONTACTED = "CONTACTED"
    MEETING = "MEETING"
    PASSED = "PASSED"
    TERM_SHEET = "TERM_SHEET"

class RoundTracker(Base):
    id: str
    idea_id: str
    user_id: str
    target_amount: int          # in USD
    committed_amount: int
    soft_circled_amount: int
    round_type: str             # Pre-seed, Seed, Series A, etc.
    close_date: Optional[date]
    updated_at: datetime
```

**New service: `crm_service.py`**
- `list_contacts(idea_id, user, db)` — return all contacts grouped by stage
- `create_contact(idea_id, data, user, db)`
- `update_contact(contact_id, data, user, db)` — move pipeline stage, add notes
- `draft_email(contact_id, user, db)` — Claude generates a 150-word personalised cold email using idea context + investor thesis + portfolio
- `get_round(idea_id, user, db)` — round tracker summary
- `upsert_round(idea_id, data, user, db)`

**New router: `routers/crm.py`**
- `GET  /ideas/{id}/crm/contacts` — list all contacts
- `POST /ideas/{id}/crm/contacts` — add contact
- `PATCH /ideas/{id}/crm/contacts/{contact_id}` — update stage/notes
- `DELETE /ideas/{id}/crm/contacts/{contact_id}`
- `POST /ideas/{id}/crm/contacts/{contact_id}/draft-email` — AI email
- `GET  /ideas/{id}/crm/round` — round tracker
- `PUT  /ideas/{id}/crm/round` — upsert round details

### Frontend

**New page:** `/ideas/[id]/investors/` (replaces or extends existing investor route)

Layout:
- **Top bar:** Round tracker widget (target / committed / soft-circled progress bar)
- **Kanban board:** 5 columns (Target → Contacted → Meeting → Passed → Term Sheet)
  - Drag-and-drop cards
  - Each card: name, firm, follow-up date indicator, notes snippet
- **Add Investor modal:** form for manual entry; also accepts matched investors from Feature 05
- **Email Draft modal:** shows AI-generated email, editable textarea, copy button
- **Follow-up sidebar:** shows investors with overdue follow-up dates

**New hook:** `apps/web/src/hooks/useCRM.ts`

## Key Implementation Details
- Contacts added manually or imported from Feature 05 investor matches
- Follow-up dates shown as relative ("overdue 3 days", "due tomorrow") with orange/red indicators
- Email draft uses: idea title, description, UVP, validation score + investor thesis
- Round tracker widget also shown as a small pill on the idea detail hero banner when a round is active
- Pipeline stage changes trigger optimistic UI updates (same pattern as checklist)

## Files to Create
```
apps/api/app/models/investor_contact.py
apps/api/app/services/crm_service.py
apps/api/app/routers/crm.py
apps/web/src/app/(dashboard)/ideas/[id]/investors/page.tsx
apps/web/src/components/crm/InvestorBoard.tsx
apps/web/src/components/crm/EmailDraftModal.tsx
apps/web/src/components/crm/RoundTracker.tsx
apps/web/src/hooks/useCRM.ts
```

## Estimated Dev Time
6–8 days
