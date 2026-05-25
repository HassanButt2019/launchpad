# Feature 12 — Async AI Interview (Idea Discovery)

**Priority:** 12 of 13 | **Effort:** Medium | **Impact:** 💡 Medium

## What It Is
Replace the static idea submission form with an AI-conducted Socratic interview. Claude asks 8–10 targeted questions about the idea, probes for weak spots, challenges assumptions, and then auto-populates all idea fields from the conversation. Much richer input leads to much better validation.

## Why It Matters
- Current form is generic — founders fill it in 2 minutes with shallow answers
- The quality of validation is only as good as the quality of input
- An interview forces founders to articulate things they've never said out loud
- Identifies gaps the founder hasn't considered ("Who specifically is the economic buyer?")
- Creates a genuinely differentiated onboarding experience

## Interview Flow

```
Step 1: "Tell me about your startup idea in 2-3 sentences."
    → Free-form answer

Step 2: "Who exactly experiences this problem? Be specific — what's their job title, company size, 
         or life situation?"
    → Probing for target audience specificity

Step 3: "How do they currently solve this problem today?"
    → Identifies existing alternatives (competition)

Step 4: "Why hasn't this been solved well yet? What makes now the right time?"
    → Market timing and opportunity

Step 5: "How would your solution work? Walk me through the core interaction."
    → Technical and UVP clarity

Step 6: "How would you make money from this?"
    → Revenue model

Step 7: "Who would you get your first 10 customers from — and how?"
    → GTM readiness

Step 8 (conditional): If answers are vague, Claude asks 1-2 follow-up questions
    → e.g., "You mentioned 'small businesses' — can you narrow that down?"

Final step: "Based on our conversation, here's how I've summarized your idea:"
    → Shows populated fields for founder to confirm/edit
```

## Architecture

### Backend
**New interview session model:**
```python
class IdeaInterview(Base):
    id: str
    user_id: str
    idea_id: str               # null until interview completes
    messages: JSON             # [{role, content, question_key}]
    extracted_fields: JSON     # auto-populated idea fields
    status: str                # "in_progress" | "completed" | "abandoned"
    created_at: datetime
```

**New service: `interview_service.py`**
- `start_interview(user)` → creates session, returns first question
- `send_answer(session_id, answer)`:
  - Appends to message history
  - Claude decides: ask follow-up OR move to next question OR wrap up
  - Returns next message
- `extract_idea_fields(session)`:
  - Claude reads full conversation and outputs structured idea fields
  - Returns: {title, description, problem_statement, target_audience, unique_value_prop, market_size}
- `create_idea_from_interview(session_id, user, db)`:
  - Creates the Idea record from extracted fields
  - Links to session for audit trail

### Frontend
**New page:** `/ideas/interview` (replaces or sits alongside `/ideas/new`)

UI design:
- Clean chat interface (similar to AI Co-Founder Chat)
- Question displayed prominently at top
- Textarea for answer below
- Progress: "Question 4 of ~8"
- AI response shown as message bubble before next question
- Final "Confirm Your Idea" screen with editable pre-filled fields
- "Use Quick Form Instead" escape hatch for power users

## Key Implementation Detail
The Claude system prompt for the interview includes a goal: "Extract enough information to fill: title, description, problem_statement, target_audience, unique_value_prop, market_size. Keep asking until you have clear answers for all fields."

## Files to Create
- `apps/api/app/models/interview.py`
- `apps/api/app/services/interview_service.py`
- `apps/api/app/routers/interview.py`
- `apps/web/src/app/(dashboard)/ideas/interview/page.tsx`
- `apps/web/src/components/interview/InterviewChat.tsx`
- `apps/web/src/components/interview/IdeaConfirmation.tsx`

## Files to Modify
- `apps/web/src/app/(dashboard)/ideas/new/page.tsx` — add "Start with AI Interview" CTA
- `apps/web/src/app/(dashboard)/layout.tsx` — update New Idea nav to offer both paths

## Estimated Dev Time
4–5 days
