# Feature 01 — AI Co-Founder Chat

**Priority:** 1 of 13 | **Effort:** Low | **Impact:** 🔥 Critical

## What It Is
A persistent chat interface on every idea page where an AI agent acts as a strategic co-founder. It has full context of the idea — validation score, documents, formation status, all previous messages — and can answer questions, give advice, draft content, and take actions.

## Why It Matters
- Highest retention driver — founders come back daily to talk through their startup
- Converts LaunchPad from a "tool" to a "thinking partner"
- Reuses all existing infrastructure (Claude is already set up)
- Most-requested feature in every AI productivity tool

## User Stories
- "Why is my validation score only 62? What's holding it back?"
- "Draft a cold email to Sequoia Capital for my SaaS idea"
- "I'm thinking of pivoting from B2B to B2C — what do you think?"
- "Summarize everything you know about my idea"
- "What should I do this week to move from Validating to Validated?"

## Architecture

### Backend
**New model: `ConversationMessage`**
```python
class ConversationMessage(Base):
    id: str
    idea_id: str
    user_id: str
    role: str          # "user" | "assistant"
    content: str
    created_at: datetime
```

**New service: `chat_service.py`**
- `get_messages(idea_id, user, db)` — paginated history
- `send_message(idea_id, content, user, db)` — builds system prompt with full idea context, sends to Claude with message history, saves response

**System prompt context includes:**
- Idea title, description, problem, audience, UVP, market size, stage
- Latest validation score + strengths/weaknesses
- List of documents generated
- Formation status and jurisdiction (if started)
- Last 20 conversation messages

**New router: `chat.py`**
- `GET /api/v1/ideas/{idea_id}/chat` — list messages
- `POST /api/v1/ideas/{idea_id}/chat` — send message + get AI reply

**Claude model:** claude-sonnet-4-6 (needs strong reasoning for strategic advice)

### Frontend
**New page:** `/ideas/[id]/chat`

**UI:**
- Full-height chat interface (like Claude.ai)
- Message bubbles — user right, AI left
- Streaming response (SSE or polling)
- Suggested starter prompts when chat is empty
- "Based on your idea" context chip in header
- Quick action chips: "Explain my score", "Next steps", "Draft investor email"

## Key Implementation Details
- Use `system` prompt with idea context — do NOT re-inject on every message
- Store messages in DB so history persists across sessions
- Limit history sent to Claude to last 40 messages to control token cost
- Add a "Clear conversation" button
- Mark AI messages with a small "AI" badge

## Files to Create
- `apps/api/app/models/conversation.py`
- `apps/api/app/services/chat_service.py`
- `apps/api/app/routers/chat.py`
- `apps/web/src/app/(dashboard)/ideas/[id]/chat/page.tsx`
- `apps/web/src/hooks/useChat.ts`
- `apps/web/src/components/chat/ChatMessage.tsx`
- `apps/web/src/components/chat/ChatInput.tsx`

## Estimated Dev Time
2–3 days
