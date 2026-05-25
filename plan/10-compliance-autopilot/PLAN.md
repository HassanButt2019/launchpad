# Feature 10 — Compliance Autopilot

**Priority:** 10 of 13 | **Effort:** Medium | **Impact:** 💡 Medium

## What It Is
Upgrade the compliance calendar from a static list of dates into an active agent that: monitors real filing deadlines per jurisdiction, sends proactive reminders before due dates, auto-drafts the required filing content, and tracks regulatory changes that affect the company.

## Why It Matters
- Missing a compliance filing can dissolve a company or result in heavy fines
- Founders forget about compliance until it's too late
- Current compliance calendar is passive — no reminders, no drafts, no intelligence
- Recurring engagement driver — founders check in monthly

## Current State vs Target

| | Current | Autopilot |
|--|---------|-----------|
| Deadline tracking | Static list from template | Real deadlines per jurisdiction + legal structure |
| Reminders | None | Email 30/7/1 days before |
| Filing help | None | AI drafts the filing content |
| Regulatory changes | None | AI monitors and alerts |
| Recurrence | Manual | Auto-creates next year's events |

## Architecture

### Backend

**Enhanced `ComplianceEvent` model:**
```python
# Add fields:
filing_instructions: str       # AI-generated step-by-step how to file
draft_content: str             # AI-drafted filing text
reminder_30_sent: bool
reminder_7_sent: bool
reminder_1_sent: bool
auto_generated_next: bool      # whether next year's event was created
```

**New service: `compliance_autopilot_service.py`**
- `generate_filing_draft(event, formation_profile)`:
  - Claude generates the specific text/content needed for this filing
  - e.g., for Delaware Annual Franchise Tax: generates the report with estimated amounts
- `send_reminders()`:
  - Background job (cron): check events due in 30/7/1 days
  - Send email with filing instructions + direct link to filing portal
- `auto_create_recurring_events(event)`:
  - After marking an event complete, auto-create next year's equivalent
- `scan_regulatory_updates(jurisdiction)`:
  - Periodic check: has anything changed in compliance requirements for this jurisdiction?
  - Alert founder if new requirement added

**Background job scheduler:**
Add APScheduler to the FastAPI app for the reminder cron job (runs daily).

### Email Integration
Add `SENDGRID_API_KEY` or `SMTP_*` settings. Send:
- "30 days until your Delaware Annual Report is due"
- Includes: deadline date, filing portal URL, AI-drafted content, estimated cost

### Frontend
**Enhanced compliance calendar page:**
- Timeline view (not just list) — upcoming events on a visual timeline
- Traffic light status: 🟢 On track / 🟡 Due soon / 🔴 Overdue
- "Get Filing Help" button → shows AI draft + step-by-step instructions
- "Mark Complete + Create Next Year" one-click button
- Regulatory update alerts banner

## Files to Create/Modify
- `apps/api/app/services/compliance_autopilot_service.py` (new)
- `apps/api/app/models/formation.py` — add fields to ComplianceEvent
- `apps/api/app/main.py` — add APScheduler startup
- `apps/api/requirements.txt` — add APScheduler, email library
- `apps/api/app/config.py` — add email settings
- `apps/web/src/app/(dashboard)/ideas/[id]/formation/compliance/page.tsx` — enhanced UI

## Estimated Dev Time
4–5 days
