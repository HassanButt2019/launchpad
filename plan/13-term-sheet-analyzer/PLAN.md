# Feature 13 — Term Sheet Analyzer

**Priority:** 13 of 13 | **Effort:** Low | **Impact:** 💡 Medium

## What It Is
Upload any term sheet, SAFE note, or convertible note. AI extracts all key terms, flags founder-unfriendly clauses in plain English, compares against YC standard SAFE and market norms, and suggests negotiation points.

## Why It Matters
- First-time founders sign terrible deals because they don't understand term sheets
- Legal review costs $500–$2,000 per document — AI provides a free first pass
- Creates a strong reason to use LaunchPad at the most critical moment (fundraising)
- Highest-stakes use case = highest perceived value

## What AI Analyzes

**Economic terms:**
- Valuation cap and discount rate
- Pro-rata rights
- MFN (Most Favored Nation) clause
- Anti-dilution provisions (broad-based vs narrow-based weighted average vs full ratchet)
- Liquidation preference (1x non-participating vs participating)
- Dividend rights

**Control terms:**
- Board composition and voting rights
- Protective provisions (what requires investor approval)
- Information rights
- Drag-along and tag-along rights
- Right of first refusal

**Founder-specific:**
- Vesting acceleration (single vs double trigger)
- IP assignment scope
- Non-compete clause
- Founder representation and warranties

## Output Format

```markdown
# Term Sheet Analysis

## ⚡ Quick Summary
This is a **Seed SAFE** with a $5M cap and 20% discount. Overall: **Founder-friendly** with 2 flags.

## ✅ Standard / Favorable Terms
- Valuation cap ($5M): Reasonable for pre-revenue seed
- Discount rate (20%): Standard
- No board seat: Founder retains full control

## 🚩 Flags — Review with Attorney

### Flag 1: Full Ratchet Anti-Dilution (High Concern)
**What it means:** If you raise a down round, this clause can severely dilute existing founders.
**Market standard:** Broad-based weighted average is standard. Full ratchet is rare and very aggressive.
**Negotiation:** Push back hard — this is a major red flag. Request broad-based weighted average.

### Flag 2: Participating Preferred with 2x Cap
**What it means:** Investors get their money back PLUS participate in remaining proceeds on exit.
**Market standard:** 1x non-participating is the YC standard and most common in Silicon Valley.
**Negotiation:** Accept 1x participating preferred or push for non-participating.

## 📊 Comparison vs YC SAFE Standard
| Term | This Document | YC Standard | Verdict |
|------|--------------|-------------|---------|
| Valuation cap | $5M | Negotiable | ✅ |
| Anti-dilution | Full ratchet | Broad-based WA | 🚩 |
| Liquidation | 2x participating | 1x non-participating | 🚩 |
| Board seat | None | None | ✅ |

## 💬 Recommended Negotiation Points
1. Change anti-dilution from full ratchet to broad-based weighted average
2. Change liquidation preference to 1x non-participating
3. Clarify "Company IP" definition to exclude pre-existing personal projects
```

## Architecture

### Backend
**New endpoint:** `POST /api/v1/tools/term-sheet-analyze`

Input: `{ content: string }` (pasted text) OR file upload (PDF → extract text with PyPDF2)

**New service: `term_sheet_service.py`**
```python
async def analyze_term_sheet(content: str) -> dict:
    prompt = """You are a startup attorney specializing in venture financing.
    Analyze this term sheet and:
    1. Identify all key economic and control terms
    2. Flag any founder-unfriendly clauses
    3. Compare to YC standard SAFE benchmarks
    4. Provide specific negotiation recommendations
    
    Term sheet:
    {content}
    
    Return structured JSON with: summary, favorable_terms, flags, comparison_table, 
    negotiation_points"""
```

This feature is **standalone** — doesn't require an idea to be linked. Works as a standalone tool.

### Frontend
**New page:** `/tools/term-sheet` (top-level tool, not under an idea)

- Add "Tools" section to sidebar nav
- Large textarea: "Paste your term sheet here"
- OR file upload (PDF)
- "Analyze" button → results rendered as the structured report above
- Shareable link to the analysis
- "Save to idea" button to link it to an idea

## Files to Create
- `apps/api/app/services/term_sheet_service.py`
- `apps/api/app/routers/tools.py`
- `apps/web/src/app/(dashboard)/tools/term-sheet/page.tsx`
- `apps/web/src/components/tools/TermSheetReport.tsx`

## Files to Modify
- `apps/web/src/app/(dashboard)/layout.tsx` — add Tools section to sidebar
- `apps/api/app/main.py` — register tools router

## Estimated Dev Time
2 days
