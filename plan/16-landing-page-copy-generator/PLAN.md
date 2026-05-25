# Feature 16 — Landing Page Copy Generator

**Priority:** 16 of 16 | **Effort:** Medium | **Impact:** ⚡ High

## What It Is
Given the idea's title, description, UVP, target audience, and validation data, generate a complete landing page copy structure that founders can paste directly into Webflow, Framer, or any no-code builder. Lives inside the existing Documents hub as a new document type.

## Why It Matters
- Every validated founder's next step is "build a landing page and collect emails"
- Writing landing page copy is a known founder bottleneck — most hire copywriters
- The idea context already captured in LaunchPad is the perfect input for copy generation
- Low backend complexity — reuses the existing document generation pipeline

## User Stories
- "Generate landing page copy for my SaaS idea so I can paste it into Framer"
- "I want a bold, startup-tone hero section — not corporate speak"
- "Give me 5 FAQ answers I can put on my pre-launch page"
- "Export this as Markdown so I can drop it into my site builder"

## Architecture

### Backend

**Extend existing `DocumentType` enum:**
```python
class DocumentType(str, Enum):
    PITCH_DECK      = "PITCH_DECK"
    BUSINESS_PLAN   = "BUSINESS_PLAN"
    MVP_SPEC        = "MVP_SPEC"
    MARKET_RESEARCH = "MARKET_RESEARCH"
    FINANCIAL_MODEL = "FINANCIAL_MODEL"
    LEGAL_CHECKLIST = "LEGAL_CHECKLIST"
    LANDING_PAGE    = "LANDING_PAGE"    # new
```

**Extend `document_service.py`** — add `LANDING_PAGE` case to the generation switch:

Prompt structure:
```
Generate landing page copy for the following startup:
- Title: {idea.title}
- Description: {idea.description}
- Problem: {idea.problem_statement}
- Target audience: {idea.target_audience}
- Unique value prop: {idea.unique_value_prop}
- Validation score: {report.score if report else "not yet validated"}
- Tone: {tone}  # Professional | Conversational | Bold

Output exactly these sections in Markdown:
1. Hero — headline (max 8 words), subheadline (max 20 words), CTA button text
2. Problem — 2–3 sentence problem statement written for the target audience
3. Solution — 3 bullet points describing the product's core value
4. Features — 5 feature cards (title + one-line description each)
5. Social Proof — 2 placeholder testimonial quotes (realistic, not generic)
6. Pricing — 2–3 tier suggestion (Free / Pro / Enterprise or similar)
7. FAQ — 5 questions and answers
8. Footer CTA — closing headline + CTA button text
```

**DB migration:** Add `LANDING_PAGE` to the `documenttype` enum in PostgreSQL.

### Frontend

**Extend `DocumentCard.tsx`** — add entry to `docTypeConfig`:
```typescript
LANDING_PAGE: {
  label: 'Landing Page',
  icon: Layout,
  description: 'Full landing page copy ready for Webflow or Framer',
}
```

**Extend `DocumentEditor.tsx`** — add a "Preview" tab alongside "Edit" when `docType === LANDING_PAGE`:
- Renders each section as a styled card (hero in large type, features as a 3-column grid, etc.)
- Gives founders a visual sense of the page before exporting

**Tone selector** — shown before generation (replaces the immediate generate on click):
- Small modal with 3 options: Professional, Conversational, Bold/Startup
- Passes `tone` as a parameter to the generation endpoint

**Export options** (in DocumentEditor header):
- Copy as Markdown (existing clipboard copy)
- Download `.md` (existing download)
- Download `.txt` (new — strips markdown syntax for plain paste)

## Key Implementation Details
- Tone is passed as a query param: `POST /ideas/{id}/documents?doc_type=LANDING_PAGE&tone=bold`
- If a validation report exists, include the score and top strengths in the prompt to sharpen the copy
- Preview mode is read-only — editing happens in the existing markdown editor tab
- `.txt` export strips `#`, `**`, `-` etc. using a simple regex pass before download

## Files to Modify
```
packages/shared/src/types.ts               — add LANDING_PAGE to DocumentType enum
apps/api/app/services/document_service.py  — add LANDING_PAGE generation case
apps/api/app/main.py                       — DB migration for new enum value
apps/web/src/components/documents/DocumentCard.tsx   — new docTypeConfig entry
apps/web/src/components/documents/DocumentEditor.tsx — Preview tab + .txt export
```

## Files to Create
```
apps/web/src/components/documents/LandingPagePreview.tsx  — section renderer
```

## Estimated Dev Time
3–4 days
