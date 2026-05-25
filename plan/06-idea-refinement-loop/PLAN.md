# Feature 06 — Idea Refinement Loop

**Priority:** 6 of 13 | **Effort:** Medium | **Impact:** ⚡ High

## What It Is
An iterative AI improvement cycle. After validation, the agent identifies the 3 weakest areas of your idea, asks targeted follow-up questions, incorporates your answers, rewrites those weak areas, and re-runs validation. The score improves iteratively with a visible trajectory.

## Why It Matters
- Current validation is a dead end — you get a score but don't know how to improve it
- Founders with low scores abandon the platform; a refinement loop keeps them engaged
- Creates a compelling "score improvement" game loop (60 → 72 → 81)
- Forces founders to think deeply about their idea's gaps

## User Flow

```
Validation Score: 62
        ↓
"Your 3 weakest areas:"
  1. Problem clarity (42/100)
  2. Revenue model (38/100)
  3. Competitive moat (51/100)
        ↓
AI asks 2 targeted questions per weak area (6 total)
        ↓
Founder answers in text fields
        ↓
AI rewrites the weak sections of the idea
        ↓
Re-runs validation → Score: 74
        ↓
Score trajectory chart: 62 → 74
```

## Architecture

### Backend
**New model: `RefinementSession`**
```python
class RefinementSession(Base):
    id: str
    idea_id: str
    iteration: int              # 1, 2, 3...
    weak_areas: JSON            # [{"area": "revenue_model", "score": 38, "questions": [...]}]
    founder_answers: JSON       # {"q1": "answer", "q2": "answer", ...}
    ai_suggestions: JSON        # what AI changed and why
    score_before: int
    score_after: int
    created_at: datetime
```

**New service: `refinement_service.py`**
- `analyze_weaknesses(idea, validation_report)`:
  - Identifies bottom 3 scored dimensions
  - Generates 2 targeted questions per weakness
  - Returns structured question set
- `apply_refinements(idea, answers, refinement_session)`:
  - Claude incorporates founder answers into improved idea text
  - Updates idea fields (description, problem_statement, uvp, etc.)
  - Triggers re-validation
  - Saves score trajectory

### Frontend
**New component: `RefinementWizard`**

Step 1 — "Here's what's holding you back":
- 3 cards showing weak areas with sub-scores and explanation
- "Start Refining" CTA

Step 2 — Targeted questions (2 per weakness):
- Clean form with one question per screen (wizard style)
- Progress indicator: "Question 3 of 6"
- Examples shown under each question

Step 3 — AI applying changes:
- Animated "Updating your idea…" state
- Shows what was changed: "Refined your revenue model description based on your answers"

Step 4 — Results:
- New validation score
- Score trajectory graph (simple line chart)
- Diff view: before/after for each changed field
- "Refine Again" button (up to 3 iterations)

## Score Trajectory
Store each validation score in `RefinementSession`. Display as a sparkline on the idea detail page:
```
Score history: ●62 → ●74 → ●81
```

## Files to Create
- `apps/api/app/models/refinement.py`
- `apps/api/app/services/refinement_service.py`
- `apps/api/app/routers/refinement.py`
- `apps/web/src/app/(dashboard)/ideas/[id]/refine/page.tsx`
- `apps/web/src/components/idea/RefinementWizard.tsx`
- `apps/web/src/components/idea/ScoreTrajectory.tsx`

## Estimated Dev Time
4–5 days
