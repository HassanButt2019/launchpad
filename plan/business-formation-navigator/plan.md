# Feature Plan: Business Formation Navigator

**Feature Slug:** `business-formation-navigator`
**Product:** LaunchPad
**Author:** Planning session — 2026-05-21
**Status:** Draft

---

## 1. Problem Statement

Entrepreneurs who have validated an idea face a massive, confusing, and costly next step:
**actually registering and legally forming their business.** The requirements differ wildly by
country — a Delaware C-Corp, a UK Ltd, a UAE Free Zone LLC, and a German GmbH each have
completely different documents, timelines, costs, and ongoing compliance obligations.

Right now, founders have to piece this together from dozens of government websites, Reddit
threads, and expensive lawyers. LaunchPad already takes them from idea → validation → journey.
This feature completes the loop: **idea → validated → legally formed company, ready to operate.**

---

## 2. Feature Overview

**Business Formation Navigator** is an AI-powered, country-aware wizard that:

1. Recommends the right **legal structure** for a founder's business type and goals
2. Generates a **personalised document checklist** — exactly what they need to file and why
3. Produces **draft versions of required documents** using AI (Articles of Incorporation, MOA/AOA, etc.)
4. Shows a **timeline and cost estimate** per country
5. Tracks their **compliance obligations** after formation (annual filings, taxes, renewals)
6. Integrates directly with their **existing LaunchPad idea** — one flow from validated idea to incorporated company

---

## 3. Supported Jurisdictions (Phase 1)

| Region      | Jurisdictions                                                    |
|-------------|------------------------------------------------------------------|
| USA         | Delaware, Wyoming, Florida, California (state selector)          |
| Europe      | United Kingdom, Germany, Netherlands, Estonia (e-Residency)      |
| Middle East | UAE — Dubai Mainland, DIFC, ADGM, Dubai Free Zones (DMCC, IFZA) |
| Remote-first| Estonia e-Residency (global, fully digital)                      |

> Phase 2 additions: Singapore, Canada, Ireland, Portugal (NHR), Poland

---

## 4. Core Modules

### 4.1 Jurisdiction Selector & Recommendation Engine

**What it does:**
An interactive step-by-step wizard that asks the founder:
- Where do they (and their co-founders) live?
- Where are their customers?
- What type of business? (SaaS, e-commerce, services, hardware, fintech, etc.)
- Do they plan to raise VC funding?
- What is their expected revenue in year 1?
- Do they want full online/remote incorporation?

**AI recommendation output:**
Based on answers, the AI recommends 1–3 jurisdictions with a clear reasoning card:
- "Delaware C-Corp — Best if you plan to raise US VC funding. 93% of VC-backed startups incorporate here."
- "Estonia e-Residency OÜ — Best for remote founders serving EU clients. Fully digital, €190 state fee."
- "DMCC Free Zone LLC — Best for UAE-based operations, 0% corporate tax, 100% foreign ownership."

Each recommendation card shows:
- Setup cost (one-time)
- Annual cost (maintenance)
- Time to incorporate
- Tax rate (corporate)
- Foreign ownership allowed? (yes/no)
- VC-fundable? (yes/no)
- Remote setup? (yes/no)

---

### 4.2 Document Checklist Generator

After jurisdiction selection, generate a **step-by-step checklist** specific to that jurisdiction
and business type. Each item includes:

- What the document is
- Why it's required
- Who issues / who fills it out
- Estimated time to obtain
- Link to official government portal
- Whether LaunchPad can generate a draft

**Example — Delaware C-Corp checklist:**

```
Formation Documents
  ☐ Certificate of Incorporation (filed with DE Division of Corporations) — LaunchPad can draft
  ☐ Bylaws — LaunchPad can draft
  ☐ Stock Ledger / Cap Table (initial) — LaunchPad can draft
  ☐ Organizational Board Resolutions — LaunchPad can draft
  ☐ Founder Stock Purchase Agreements (83b elections) — LaunchPad can draft
  ☐ IP Assignment Agreements — LaunchPad can draft

Registration & Compliance
  ☐ EIN (Employer Identification Number) — IRS Form SS-4 (free, online, 15 min)
  ☐ Registered Agent (annual ~$50–$300) — external service required
  ☐ Delaware Franchise Tax registration
  ☐ Foreign Qualification (if operating in another state)

Banking
  ☐ US Business Bank Account (Mercury, Brex, or traditional)
  ☐ Stripe Atlas / similar if non-US founder

Post-Formation Compliance
  ☐ Annual Franchise Tax Report (due March 1)
  ☐ Delaware Annual Report
  ☐ BOI Report (FinCEN Beneficial Ownership — due within 90 days of formation)
```

**Example — UAE DMCC Free Zone LLC checklist:**

```
Pre-Application
  ☐ Business activity selection (DMCC activity list — 600+ activities)
  ☐ Company name reservation (3 options, must end in "DMCC")
  ☐ Passport copies — all shareholders
  ☐ No-objection letter (if shareholder employed in UAE)

Formation Documents
  ☐ Memorandum & Articles of Association — LaunchPad can draft
  ☐ Shareholder Resolution
  ☐ Share Certificates

Government Approvals
  ☐ DMCC Trade License application (online portal)
  ☐ Initial Approval Certificate
  ☐ Lease agreement (Flexi-Desk or physical office — mandatory)

Post-Formation
  ☐ Corporate bank account (Emirates NBD, Mashreq, or neobank)
  ☐ VAT registration (if revenue > AED 375,000)
  ☐ Ultimate Beneficial Owner (UBO) registration
  ☐ Economic Substance Regulations (ESR) filing
  ☐ Annual license renewal (due date reminder)
```

---

### 4.3 AI Document Drafting

LaunchPad already generates startup docs (pitch deck, business plan, MVP spec). This module
extends that capability to **legal formation documents**:

| Document                          | Jurisdiction        | AI Draft? |
|-----------------------------------|---------------------|-----------|
| Certificate of Incorporation      | USA (Delaware)      | Yes       |
| Corporate Bylaws                  | USA                 | Yes       |
| Founder Stock Purchase Agreement  | USA                 | Yes       |
| 83(b) Election Letter             | USA                 | Yes       |
| IP Assignment Agreement           | USA / Global        | Yes       |
| Memorandum of Association (MOA)   | UAE / UK            | Yes       |
| Articles of Association (AOA)     | UAE / UK / EU       | Yes       |
| Shareholder Agreement             | Global              | Yes       |
| Operating Agreement               | USA (LLC)           | Yes       |
| Vesting Schedule template         | Global              | Yes       |

**Important disclaimer displayed on all AI drafts:**
> "This is an AI-generated draft for reference purposes only. It is not legal advice.
> Have a qualified attorney review before filing."

---

### 4.4 Cost & Timeline Estimator

A visual comparison card for selected jurisdictions showing:

```
                    Delaware C-Corp    UK Ltd    DMCC Free Zone
─────────────────────────────────────────────────────────────────
Setup Cost          $500–$1,500        £50        AED 15,000–25,000
Annual Cost         $400–$800          £13/yr     AED 10,000–15,000
Time to Incorporate 1–3 days           24 hrs     2–4 weeks
Corporate Tax       21% (federal)      25%        0% (9% if >AED 375k)
Foreign Ownership   Yes (100%)         Yes        Yes (100%)
VC Fundable         ★★★★★             ★★★☆☆      ★★☆☆☆
Remote Setup        Yes                Yes        Partial
─────────────────────────────────────────────────────────────────
```

---

### 4.5 Compliance Calendar

After formation, the founder gets a **compliance dashboard** showing:

- Annual filing deadlines (auto-populated per jurisdiction)
- Upcoming renewals (license, registered agent, etc.)
- Tax deadlines
- One-click reminder emails / push notifications

This turns LaunchPad from a one-time formation tool into a **long-term operating companion.**

---

### 4.6 Service Provider Directory (Optional — Phase 2)

Curated, vetted list of affordable service providers for each jurisdiction:
- Registered Agents (USA)
- Formation agents (UAE)
- Accountants / CPAs (per country)
- Business bank accounts (neobanks that work per jurisdiction)

Each listed with: price range, rating, affiliate/partner status (transparent).

---

## 5. Integration with Existing LaunchPad Features

| Existing Feature     | Integration                                                       |
|----------------------|-------------------------------------------------------------------|
| Idea Validation      | "Your idea is validated — ready to incorporate?" CTA on idea page |
| Startup Journey      | Add a "Formation" phase before BUILD phase in the checklist       |
| AI Documents         | Reuse existing document generation API, add new document types    |
| Stage Tracker        | Add a new stage: `INCORPORATED` after `BUILDING`                  |
| Dashboard            | Show "Formation Status" card for ideas in BUILDING/INCORPORATED   |

---

## 6. Data Models (Backend)

### New Tables

```python
# Formation profile — one per idea, tracks jurisdiction choice
class FormationProfile(Base):
    id: str (UUID)
    idea_id: str (FK → ideas)
    user_id: str (FK → users)
    jurisdiction: str  # e.g. "US_DELAWARE", "UAE_DMCC", "UK_LTD"
    legal_structure: str  # e.g. "C_CORP", "LLC", "LTD", "FREE_ZONE_LLC"
    status: str  # e.g. "PLANNING", "IN_PROGRESS", "INCORPORATED"
    estimated_cost_usd: float
    incorporation_date: datetime | None
    created_at: datetime
    updated_at: datetime

# Formation checklist items
class FormationChecklistItem(Base):
    id: str (UUID)
    formation_profile_id: str (FK)
    category: str  # e.g. "FORMATION_DOCS", "REGISTRATION", "BANKING", "COMPLIANCE"
    title: str
    description: str
    is_required: bool
    can_ai_draft: bool
    official_link: str | None
    estimated_days: int
    completed: bool
    completed_at: datetime | None
    sort_order: int

# Formation documents (extends existing document system)
class FormationDocument(Base):
    id: str (UUID)
    formation_profile_id: str (FK)
    doc_type: str  # e.g. "ARTICLES_OF_INCORPORATION", "BYLAWS", "MOA"
    jurisdiction: str
    content: str (encrypted)
    status: str  # DRAFT | GENERATING | READY
    version: int
    generated_at: datetime

# Compliance calendar events
class ComplianceEvent(Base):
    id: str (UUID)
    formation_profile_id: str (FK)
    title: str
    description: str
    due_date: datetime
    recurrence: str | None  # "ANNUAL", "QUARTERLY", etc.
    completed: bool
    reminder_sent: bool
```

---

## 7. API Endpoints (Backend)

```
POST   /api/v1/formation/start                  — Create formation profile (jurisdiction wizard output)
GET    /api/v1/formation/{idea_id}              — Get formation profile for an idea
PUT    /api/v1/formation/{profile_id}           — Update formation profile
POST   /api/v1/formation/{profile_id}/checklist — Generate checklist for jurisdiction
PATCH  /api/v1/formation/{profile_id}/checklist/{item_id} — Toggle checklist item

POST   /api/v1/formation/{profile_id}/documents/generate  — AI-generate a formation document
GET    /api/v1/formation/{profile_id}/documents           — List formation documents
GET    /api/v1/formation/{profile_id}/documents/{doc_id}  — Get document content

GET    /api/v1/formation/{profile_id}/compliance          — Get compliance calendar
PATCH  /api/v1/formation/{profile_id}/compliance/{event_id} — Mark event complete

GET    /api/v1/jurisdictions                    — List supported jurisdictions with metadata
GET    /api/v1/jurisdictions/{code}/requirements — Get requirements for a jurisdiction
POST   /api/v1/jurisdictions/recommend          — AI jurisdiction recommendation (wizard answers → recommendations)
```

---

## 8. Frontend Pages & Routes

```
/ideas/[id]/formation                           — Formation hub for an idea
/ideas/[id]/formation/wizard                    — Jurisdiction recommendation wizard
/ideas/[id]/formation/checklist                 — Document checklist tracker
/ideas/[id]/formation/documents                 — Formation documents (AI drafts)
/ideas/[id]/formation/compliance                — Compliance calendar
/ideas/[id]/formation/compare                   — Cost/timeline comparison table
```

---

## 9. AI Prompt Strategy

### Jurisdiction Recommendation Prompt
```
You are a startup formation expert. Based on the following founder profile, recommend
the top 2-3 jurisdictions for incorporation with clear reasoning.

Founder profile:
- Founder location: {location}
- Customer location: {customer_location}
- Business type: {business_type}
- VC funding planned: {vc_plans}
- Year 1 revenue estimate: {revenue_estimate}
- Remote-first preference: {remote_preference}

For each recommendation, provide:
1. Jurisdiction name and legal structure
2. One-sentence primary reason
3. Setup cost range (USD)
4. Annual maintenance cost range
5. Time to incorporate
6. Corporate tax rate
7. Key advantage for this founder specifically
8. One key risk or downside

Respond in JSON format.
```

### Formation Document Generation Prompt
```
You are a startup attorney generating a {document_type} for a {legal_structure} 
being incorporated in {jurisdiction}.

Company details:
- Company name: {company_name}
- Business description: {description}
- Founders: {founders}
- Share structure: {share_structure}
- Business activity: {business_activity}

Generate a complete, standard {document_type} appropriate for {jurisdiction}.
Include all required sections. Mark any section requiring attorney customization
with [ATTORNEY REVIEW REQUIRED].

Important: Add disclaimer that this is an AI-generated draft for reference only.
```

---

## 10. User Flow (End-to-End)

```
[Idea validated]
      │
      ▼
[Formation CTA on idea page]
"Your idea is validated. Ready to incorporate? →"
      │
      ▼
[Wizard — Step 1: Where are you based?]
[Wizard — Step 2: Where are your customers?]
[Wizard — Step 3: Business type?]
[Wizard — Step 4: VC funding plans?]
[Wizard — Step 5: Remote incorporation OK?]
      │
      ▼
[AI Recommendation Screen]
Shows 2–3 jurisdiction cards with comparison table
Founder selects jurisdiction
      │
      ▼
[Formation Hub — /ideas/[id]/formation]
├── Checklist tab (progress: 0/12 items)
├── Documents tab (AI draft available)
├── Timeline & Cost tab
└── Compliance Calendar tab
      │
      ▼
[Checklist — founder works through items]
AI drafts downloadable for legal review
      │
      ▼
[Mark as Incorporated]
Stage updates to INCORPORATED
Dashboard shows "Formed in Delaware ✓"
Compliance calendar activates
```

---

## 11. Idea → Stage Mapping Update

Add `INCORPORATED` to the `IdeaStage` enum:

```
DRAFT → VALIDATING → VALIDATED → BUILDING → INCORPORATED
```

The StageTracker component gets a 5th step. The Formation feature is the bridge
between BUILDING and INCORPORATED.

---

## 12. Differentiation (Why This Is Powerful)

| What competitors do                        | What LaunchPad does differently               |
|--------------------------------------------|-----------------------------------------------|
| Generic "how to register a company" blogs  | Personalised to their idea + goals + location |
| Expensive lawyers ($3k–$10k)               | AI drafts for free, attorney review optional  |
| Stripe Atlas (US-only, $500 flat)          | Multi-jurisdiction, Europe + UAE included     |
| Clerky / Carta (cap table only)            | Full formation + ongoing compliance tracking  |
| One-time service, no ongoing support       | Compliance calendar keeps founders on track   |
| No connection to idea validation           | Seamlessly connected: validate → incorporate  |

---

## 13. Implementation Phases

### Phase 1 — MVP (4–6 weeks)
- [ ] Jurisdiction data model (static JSON config for 6 jurisdictions)
- [ ] Formation profile + checklist API endpoints
- [ ] Wizard UI (5-step, no AI yet — rule-based recommendation)
- [ ] Checklist UI per jurisdiction (static templates)
- [ ] Cost/timeline comparison table
- [ ] Formation hub page integrated into idea detail
- [ ] Stage: add INCORPORATED to IdeaStage

### Phase 2 — AI Layer (3–4 weeks)
- [ ] AI jurisdiction recommendation (replace rule-based with LLM)
- [ ] AI formation document generation (6 core document types)
- [ ] Document editor for formation docs (reuse existing DocumentEditor)
- [ ] Add remaining jurisdictions (Estonia, Netherlands, Singapore)

### Phase 3 — Compliance & Retention (3–4 weeks)
- [ ] Compliance calendar data model + API
- [ ] Compliance dashboard UI
- [ ] Email reminders for upcoming deadlines
- [ ] Service provider directory (Phase 2 optional)

---

## 14. Success Metrics

| Metric                                      | Target (3 months post-launch) |
|---------------------------------------------|-------------------------------|
| Founders who start the wizard               | 40% of validated ideas        |
| Wizard completion rate                      | > 60%                         |
| Formation hub weekly active users           | 200+                          |
| AI documents generated                      | 500+                          |
| Founders who reach INCORPORATED stage       | 50+                           |
| Compliance calendar activated               | 80% of INCORPORATED founders  |

---

## 15. Risks & Mitigations

| Risk                                              | Mitigation                                              |
|---------------------------------------------------|---------------------------------------------------------|
| AI legal docs could be inaccurate                 | Prominent disclaimer, encourage attorney review         |
| Jurisdiction requirements change frequently       | Static config versioned in DB, quarterly review process |
| UAE Free Zone requirements are complex            | Partner with a DMCC-registered agent for validation     |
| Users skip attorney review and get into trouble   | Required acknowledgment checkbox before download        |
| Feature scope too large for solo dev              | Phase 1 uses static templates, no AI required for MVP   |

---

## 16. Open Questions

1. Should we integrate with formation APIs (Stripe Atlas, Firstbase, Doola) for actual filing,
   or stay as a guidance/document tool only?
2. Do we charge for this feature (premium tier) or keep it free?
3. Should co-founder management be part of this feature (shared cap table, multi-user)?
4. For UAE: should we partner with a DMCC-registered business setup agent?
5. For USA: should we integrate with Delaware Division of Corporations API for real-time filing?

---

*End of plan. Next step: Review open questions, then begin Phase 1 implementation.*
