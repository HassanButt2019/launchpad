# Feature 04 — Go-to-Market Strategy Generator

**Priority:** 4 of 13 | **Effort:** Low | **Impact:** ⚡ High

## What It Is
A new document type that generates a complete, structured go-to-market strategy from the idea's context and validation data. Covers ICP, channels, messaging, pricing, and a week-by-week 90-day launch plan.

## Why It Matters
- Founders know WHAT they're building but struggle with HOW to get customers
- GTM is the #1 thing that kills good ideas — most founders launch wrong
- No extra infrastructure needed — reuses existing document generation system
- High perceived value, often the most-used doc in practice

## Output Sections

```markdown
# Go-to-Market Strategy: [Idea Name]

## 1. Ideal Customer Profile (ICP)
- Primary persona: [detailed description]
- Demographics, psychographics, job titles
- Pain level: High/Medium/Low
- Willingness to pay: estimated range

## 2. Value Proposition & Messaging
- Core message (one sentence)
- Supporting messages per customer segment
- Positioning statement
- Key differentiators to lead with

## 3. Channel Strategy
| Channel | Why it fits | Est. CAC | Priority |
|---------|-------------|----------|----------|
| ...     | ...         | ...      | ...      |

## 4. Pricing Strategy
- Recommended model (freemium / subscription / usage / one-time)
- Price points with rationale
- Competitive pricing comparison

## 5. 90-Day Launch Plan
### Week 1–2: Foundation
### Week 3–4: Soft Launch
### Month 2: Growth Experiments
### Month 3: Double Down

## 6. Success Metrics
- North Star Metric
- Week 4 target
- Month 3 target
```

## Implementation

### Backend
Add `GTM_STRATEGY` to `DocumentType` enum and create a prompt in `document_service.py`:

```python
"GTM_STRATEGY": """You are a growth strategist who has helped 200+ startups launch.
Generate a complete go-to-market strategy for this startup:

Idea: {title}
Description: {description}
Problem: {problem}
Target audience: {audience}
Unique value: {uvp}
Market size: {market_size}
Validation score: {score}/100
Key strengths: {strengths}
Key weaknesses: {weaknesses}

Create a specific, actionable GTM strategy. Avoid generic advice.
Every recommendation must be tailored to this specific idea."""
```

### Frontend
- Add GTM Strategy card to the documents grid (`/ideas/[id]/documents`)
- Add icon: `Map` or `Navigation` from lucide-react
- Same generate/view/regenerate pattern as other docs

## Files to Modify
- `apps/api/app/models/document.py` — add GTM_STRATEGY to DocumentType enum
- `apps/api/app/services/document_service.py` — add GTM_STRATEGY prompt, pass validation data
- `packages/shared/src/types.ts` — add GTM_STRATEGY to DocumentType
- `apps/web/src/components/documents/DocumentCard.tsx` — add GTM_STRATEGY config

## Key Detail
Pass the **validation report** into the GTM prompt (score + strengths + weaknesses) — this makes the GTM strategy specifically address the idea's validated strengths and compensate for weaknesses.

## Estimated Dev Time
1 day
