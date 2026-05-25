# Feature 09 — Pitch Deck Feedback Loop

**Priority:** 9 of 13 | **Effort:** Low | **Impact:** 💡 Medium

## What It Is
After generating a pitch deck, founders can paste in investor rejection feedback or notes. AI analyzes the feedback patterns, identifies what to fix, and regenerates specific slides with improvements. Tracks version history with change rationale.

## Why It Matters
- Most founders get rejected 50–100+ times before raising — they need to iterate
- Founders don't know how to interpret vague investor feedback ("not the right fit")
- Turns rejections into actionable product improvements
- Creates engagement loop: generate → share → get rejected → improve → repeat

## User Flow

1. Generate initial pitch deck (already exists)
2. "Got feedback?" button appears on the deck card
3. Founder pastes rejection email / feedback notes (free text)
4. AI analyzes: "Investor flagged market size concern and unclear monetization"
5. Shows: "Recommended slide improvements: Slide 4 (Market Size), Slide 7 (Revenue)"
6. One click: "Apply improvements" → Claude rewrites those sections
7. Version history: v1 → v2 → v3 with change summaries

## Architecture

### Backend
**New model: `DeckFeedbackSession`**
```python
class DeckFeedbackSession(Base):
    id: str
    document_id: str    # the pitch deck document
    raw_feedback: str   # pasted investor feedback
    analysis: JSON      # {"issues": [...], "slides_to_fix": [...]}
    improvements: JSON  # what was changed per section
    version_before: int
    version_after: int
    created_at: datetime
```

**New service: `feedback_service.py`**
- `analyze_feedback(feedback_text, deck_content)`:
  - Claude reads the feedback and deck together
  - Identifies which sections of the deck the feedback is about
  - Returns structured issues list with severity and affected sections
- `apply_improvements(document, issues, original_idea)`:
  - Claude rewrites the flagged sections addressing each issue
  - Returns new complete deck content
  - Saves as new document version

### Frontend
- "Got investor feedback?" card appears below deck in the documents view
- Textarea to paste feedback (supports multiple feedback entries)
- Analysis results: "3 issues found" with expandable explanations
- "Improve Deck" button → shows diff of changes before confirming
- Version history drawer: v1 (original) → v2 (after Sequoia feedback) → v3

## Key Implementation Detail
Feed the ORIGINAL idea context AND the current deck content AND the feedback to Claude simultaneously. This allows Claude to rewrite deck sections that contradict the feedback while staying true to the idea.

## Files to Create
- `apps/api/app/models/feedback_session.py`
- `apps/api/app/services/feedback_service.py`
- `apps/api/app/routers/feedback.py`
- `apps/web/src/components/documents/FeedbackPanel.tsx`
- `apps/web/src/components/documents/VersionHistory.tsx`

## Estimated Dev Time
2–3 days
