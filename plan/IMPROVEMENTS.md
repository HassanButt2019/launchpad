# Production-Grade Improvements

Audit of existing features — gaps identified before shipping to real users.
Ordered by priority: 🔴 Critical → 🟡 Important → 🟢 Polish.

---

## 🔴 Critical — Fix First

These cause silent failures or visible broken behaviour in production.

### 1. Toast / Error Notification System
**Problem:** Every mutation (`useValidateIdea`, `useGenerateDocument`, `useCreateIdea`, `useDeleteIdea`, etc.) has `onSuccess` handlers but zero `onError` handlers. When a request fails — rate limit, API down, network error, invalid input — the UI goes completely silent. The user has no idea what happened.
**Impact:** Affects every single feature.
**Fix:** Install `react-hot-toast` or `sonner`. Add a global error handler in the axios interceptor that fires a toast on non-401 errors. Add `onError` to every mutation hook.
**Files:** `apps/web/src/lib/axios.ts`, `apps/web/src/hooks/useIdeas.ts`, `apps/web/src/hooks/useChat.ts`, `apps/web/src/app/layout.tsx`

---

### 2. Error Boundary
**Problem:** Any unhandled render error (null reference, bad API shape, etc.) takes down the entire dashboard page with a white screen and no recovery path.
**Impact:** One bad API response can make the whole app unusable.
**Fix:** Wrap the dashboard layout in a React Error Boundary component. Show a friendly "Something went wrong" UI with a reload button rather than a blank screen.
**Files:** `apps/web/src/app/(dashboard)/layout.tsx`, new `apps/web/src/components/ui/ErrorBoundary.tsx`

---

### 3. Idea Stage Stale After Validation
**Problem:** After running AI Validation, the backend advances the idea stage from `VALIDATING` → `VALIDATED`. But `ideaKeys.detail(id)` is never invalidated in `useValidateIdea`. The stage badge on the idea detail page stays stale until the user manually refreshes.
**Impact:** Users see wrong stage after every validation run.
**Fix:** Add `qc.invalidateQueries({ queryKey: ideaKeys.detail(ideaId) })` in the `onSuccess` handler of `useValidateIdea`.
**Files:** `apps/web/src/hooks/useIdeas.ts`

---

## 🟡 Important — Before Public Launch

These are quality gaps that erode trust in a real product.

### 4. Rate Limit Feedback in the UI
**Problem:** When a user hits a rate limit (30/min chat, 5/min market research, 20/min document generation), the API returns HTTP 429. The frontend swallows it silently — no toast, no message, no retry indicator.
**Fix:** Detect 429 in the axios response interceptor and show a specific toast: "You're doing that too fast — please wait a moment." For SSE endpoints (chat, market research), detect the 429 before opening the stream and show an inline error.
**Files:** `apps/web/src/lib/axios.ts`, `apps/web/src/hooks/useChat.ts`, `apps/web/src/components/documents/ResearchProgress.tsx`

---

### 5. Document Card — Prevent Duplicate Generation
**Problem:** Clicking "Generate" or "Regenerate" shows a spinner but does not disable the card while generating. Users click multiple times, firing multiple Claude API calls and creating duplicate documents in the database.
**Fix:** Disable the entire card (not just the button) while `isPending` is true. Add a visible "Generating…" overlay on the card with a progress indicator.
**Files:** `apps/web/src/components/documents/DocumentCard.tsx`

---

### 6. Copy Button on AI Chat Responses
**Problem:** The AI Co-Founder Chat produces drafts, pitches, and emails. Users have no way to copy the AI response text without manually selecting it. This is a standard expectation in any chat UI.
**Fix:** Add a "Copy" button (clipboard icon) on each assistant message bubble that appears on hover. Use the Clipboard API.
**Files:** `apps/web/src/app/(dashboard)/ideas/[id]/chat/page.tsx`

---

### 7. Formation Documents — Regenerate Button
**Problem:** Once a formation document (Articles of Incorporation, Operating Agreement, etc.) is generated, the only way to regenerate it is to know to delete the document and recreate it. There is no visible "Regenerate" button in the document viewer.
**Fix:** Add a "Regenerate" button in the `DocumentModal` footer next to "Download". Confirm before replacing since it's a destructive action.
**Files:** `apps/web/src/app/(dashboard)/ideas/[id]/formation/documents/page.tsx`

---

### 8. Validation Score on Ideas List Page
**Problem:** The ideas list page (`/ideas`) shows: Idea Name | Stage | Market Size | Created. The validation score is already fetched and available but never shown on the list. It is one of the most useful signals at a glance.
**Fix:** Add a "Score" column to the ideas table that shows the validation score badge (or "—" if not yet validated). This requires either including the score in the idea list API response or fetching it separately.
**Files:** `apps/web/src/app/(dashboard)/ideas/page.tsx`, potentially `apps/api/app/routers/ideas.py`

---

### 9. Old Validation Reports Missing New Fields
**Problem:** The `competitive_landscape`, `market_opportunity`, `score_rationale`, and `sources` columns were added after users already had validation reports. Existing reports have `NULL` in these fields. The UI shows empty sections with no explanation, which looks broken.
**Fix:** Show a subtle "Re-validate to see competitive analysis" prompt inside the empty sections when the field is null and the report was created before these fields existed (or simply always when the field is null).
**Files:** `apps/web/src/app/(dashboard)/ideas/[id]/validate/page.tsx`

---

### 10. Market Research — Re-run Button on Existing Report
**Problem:** After the first market research report is generated, the DocumentCard shows "View" and "Regenerate". Clicking "Regenerate" opens the `ResearchProgress` modal which starts immediately. But there is no way to re-run from *inside* the viewer once you've already read it — you have to close and click Regenerate from the card.
**Fix:** Add a "Re-run Research" button inside the `ResearchProgress` modal footer when `isDone` is true, so users can refresh data without closing and reopening.
**Files:** `apps/web/src/components/documents/ResearchProgress.tsx`

---

## 🟢 Polish — Ongoing Quality

These improve the feel and professionalism but are not blockers.

### 11. Chat Message Timestamps
**Problem:** Chat messages show no time information. In a long conversation, users cannot tell when a message was sent or how long the AI took to respond.
**Fix:** Show a subtle relative timestamp ("2 min ago", "Yesterday") below each message bubble on hover.
**Files:** `apps/web/src/app/(dashboard)/ideas/[id]/chat/page.tsx`

---

### 12. Character Count on Chat Input
**Problem:** The chat input has a 4000-character server-side limit (`max_length=4000` in the Pydantic schema) but users have no indication of this. Long messages fail silently.
**Fix:** Show a character counter near the send button that turns orange at 3500 and red at 4000. Disable send at 4000.
**Files:** `apps/web/src/app/(dashboard)/ideas/[id]/chat/page.tsx`

---

### 13. Empty State for Dashboard with No Ideas
**Problem:** When a new user logs in with zero ideas, the dashboard stats show "0" everywhere with no contextual guidance on what to do next. There is no onboarding prompt.
**Fix:** Detect zero ideas and show an onboarding card: "Create your first idea to get started" with a direct CTA button.
**Files:** `apps/web/src/app/(dashboard)/dashboard/page.tsx`

---

### 14. Confirmation Dialog for Destructive Actions
**Problem:** Deleting an idea uses a native `confirm()` dialog which looks out of place. The "Clear Chat" uses a two-click confirm pattern. These are inconsistent.
**Fix:** Build a reusable `ConfirmDialog` component using a proper modal. Replace all `confirm()` calls with it.
**Files:** New `apps/web/src/components/ui/ConfirmDialog.tsx`, `apps/web/src/app/(dashboard)/ideas/[id]/page.tsx`

---

### 15. API Health Check in UI
**Problem:** If the backend is down or the `ANTHROPIC_API_KEY` is missing, all AI features fail silently. There is no status indicator anywhere in the UI.
**Fix:** Add a small status indicator in the sidebar footer. Poll the `/health` endpoint on mount. Show a yellow dot with "AI degraded" if the key is missing.
**Files:** `apps/web/src/app/(dashboard)/layout.tsx`

---

### 16. Checklist Progress Persistence
**Problem:** Checking off items in the Startup Journey checklist calls `PATCH /checklist/{item_id}` but there is no optimistic update — the checkbox visually resets and then re-checks after the server response. This creates a noticeable flicker.
**Fix:** Apply an optimistic update to the checklist query cache immediately on check, then revert on error.
**Files:** `apps/web/src/hooks/useIdeas.ts`, `apps/web/src/app/(dashboard)/ideas/[id]/journey/page.tsx`

---

### 17. Session Expiry UX
**Problem:** When the refresh token expires (after 7 days), the user is silently logged out by the axios interceptor. They lose any unsaved work (drafted chat message, form input) with no warning.
**Fix:** Before the token expires, show a "Your session is expiring soon — click to stay logged in" banner. Detect the 401 + failed refresh and redirect to `/login` with a `?reason=session_expired` query param that shows a toast on the login page.
**Files:** `apps/web/src/lib/axios.ts`, `apps/web/src/app/(auth)/login/page.tsx`

---

## Summary Table

| # | Title | Priority | Effort | Files |
|---|-------|----------|--------|-------|
| 1 | Toast / Error Notifications | 🔴 Critical | Small | axios.ts, hooks |
| 2 | Error Boundary | 🔴 Critical | Small | layout.tsx |
| 3 | Idea Stage Stale After Validation | 🔴 Critical | Tiny | useIdeas.ts |
| 4 | Rate Limit Feedback | 🟡 Important | Small | axios.ts, hooks |
| 5 | Document Card Duplicate Prevention | 🟡 Important | Small | DocumentCard.tsx |
| 6 | Copy Button on Chat Responses | 🟡 Important | Small | chat/page.tsx |
| 7 | Formation Doc Regenerate Button | 🟡 Important | Small | documents/page.tsx |
| 8 | Validation Score on Ideas List | 🟡 Important | Medium | ideas/page.tsx |
| 9 | Old Validation Reports Null Fields | 🟡 Important | Tiny | validate/page.tsx |
| 10 | Market Research Re-run Inside Modal | 🟡 Important | Tiny | ResearchProgress.tsx |
| 11 | Chat Message Timestamps | 🟢 Polish | Tiny | chat/page.tsx |
| 12 | Chat Character Count | 🟢 Polish | Tiny | chat/page.tsx |
| 13 | Empty Dashboard Onboarding | 🟢 Polish | Small | dashboard/page.tsx |
| 14 | Consistent Confirm Dialog | 🟢 Polish | Small | new ConfirmDialog.tsx |
| 15 | API Health Status Indicator | 🟢 Polish | Small | layout.tsx |
| 16 | Checklist Optimistic Update | 🟢 Polish | Small | useIdeas.ts |
| 17 | Session Expiry UX | 🟢 Polish | Medium | axios.ts, login |
