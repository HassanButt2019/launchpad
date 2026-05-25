# Feature 14 — Customer Discovery Suite

**Priority:** 14 of 16 | **Effort:** Large | **Impact:** 🔥 High

## What It Is
A structured customer discovery workflow tied to each idea. Validates with real humans, not just AI scoring. Includes an ICP builder, AI-generated interview questions, a shareable public survey link, a response inbox, and AI synthesis of patterns across responses.

## Why It Matters
- AI validation scores the *idea* — customer discovery validates it with *real people*
- Most founders skip structured discovery because it's friction-heavy; this removes that friction
- Synthesis of 10+ responses gives signal that no amount of AI analysis can replicate
- Creates a data moat: idea + AI score + real customer signal in one place

## User Stories
- "Generate interview questions I can use in a 30-minute customer call"
- "I want to share a survey link on Twitter and see who responds"
- "After 15 responses, what are the top pain points people mentioned?"
- "Who is my ideal customer — describe them in detail"

## Architecture

### Backend

**New models:**
```python
class CustomerSurvey(Base):
    id: str
    idea_id: str
    user_id: str
    token: str          # public URL token (UUID)
    title: str
    questions: JSON     # list of question strings
    is_active: bool
    created_at: datetime

class SurveyResponse(Base):
    id: str
    survey_id: str
    answers: JSON       # {question_index: answer_text}
    respondent_context: str   # optional (city, role if collected)
    submitted_at: datetime
```

**New service: `discovery_service.py`**
- `generate_icp(idea, db)` — Claude generates Ideal Customer Profile with demographics, psychographics, jobs-to-be-done, and current workarounds
- `generate_questions(idea, db)` — Claude generates 12 discovery questions grouped by theme (problem awareness, current behaviour, willingness to pay)
- `create_survey(idea_id, user, db)` — creates survey with generated questions + public token
- `submit_response(token, answers, db)` — no-auth endpoint; saves to SurveyResponse
- `synthesize_responses(survey_id, user, db)` — Claude reads all responses, extracts top pain points, surprises, and recommendation for idea pivot or validation

**New router: `routers/discovery.py`**
- `GET  /ideas/{id}/discovery/icp` — get or generate ICP
- `GET  /ideas/{id}/discovery/questions` — get or generate questions
- `POST /ideas/{id}/discovery/survey` — create survey
- `GET  /ideas/{id}/discovery/survey` — get survey + response count
- `POST /ideas/{id}/discovery/synthesize` — trigger AI synthesis
- `GET  /survey/{token}` — public (no auth) — get survey for respondent
- `POST /survey/{token}/respond` — public (no auth) — submit answers

### Frontend

**New page:** `/ideas/[id]/discovery/`

Layout (tabs):
1. **ICP** — displays the Ideal Customer Profile card with "Regenerate" option
2. **Questions** — list of interview questions with copy-all button and editable text
3. **Survey** — generate/activate survey, show shareable link with copy button, response count badge
4. **Responses** — list of submitted responses + "Synthesize with AI" button when ≥ 5 responses
5. **Synthesis** — AI summary card: top pain points, surprises, validation impact

**New public page:** `/survey/[token]`
- No auth required
- Simple form rendering each question
- Progress indicator
- Thank you screen on submit

## Key Implementation Details
- Survey token is a UUID v4 — not guessable, no auth needed for submission
- ICP and questions generated on demand and cached in DB (not regenerated on every page load)
- Synthesis only unlocked after ≥ 5 responses to prevent noise
- Synthesis result linked to idea: can optionally update the validation narrative

## Files to Create
```
apps/api/app/models/survey.py
apps/api/app/services/discovery_service.py
apps/api/app/routers/discovery.py
apps/web/src/app/(dashboard)/ideas/[id]/discovery/page.tsx
apps/web/src/app/survey/[token]/page.tsx
apps/web/src/hooks/useDiscovery.ts
```

## Estimated Dev Time
6–8 days
