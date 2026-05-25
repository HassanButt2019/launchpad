# LaunchPad Subscription Plan

## Naming Philosophy

Tier names mirror the product's own startup journey phases — the same words
already used in the checklist system (`VALIDATE → BUILD → LAUNCH`). Every
founder instantly understands where they are and where they're going.

| Tier | Name | Price | Target User |
|------|------|-------|-------------|
| 1 | **Validate** | Free | Curious founders testing an idea |
| 2 | **Build** | $19 / month | Active founders building toward launch |
| 3 | **Launch** | $49 / month | Serious founders incorporating & pitching |

---

## Cost Analysis (Why These Limits)

All AI features route through the Anthropic Claude API and Tavily search.
Understanding the per-call cost determines which features can be free.

### API Cost Per Feature Call (Claude Sonnet 4.x pricing)

| Feature | Approx. Tokens (in/out) | Est. Cost |
|---------|------------------------|-----------|
| AI Validation | ~3K in + 2K out | ~$0.04 |
| Chat message (round trip) | ~2K in + 1K out | ~$0.02 |
| Document generation | ~4K in + 6K out | ~$0.10 |
| Market Research (full) | ~15K in + 8K out + 8 Tavily calls | ~$0.17 |
| Formation document | ~5K in + 8K out | ~$0.14 |
| Jurisdiction AI recommendation | ~2K in + 1K out | ~$0.02 |

### Free Tier — Monthly AI Cost Per Active User

| Usage | Cost |
|-------|------|
| 1 validation (lifetime, not monthly) | $0.04 |
| 10 chat messages | $0.20 |
| 2 document generations | $0.20 |
| **Total per active free user/month** | **~$0.44** |

This is low enough to absorb on the free tier without risking runaway spend.
Most free users will use far less.

### Build Tier — Monthly AI Cost Per User (Heavy Use)

| Usage | Cost |
|-------|------|
| 3 validations across ideas | $0.12 |
| 100 chat messages | $2.10 |
| 12 documents | $1.20 |
| 2 market research runs | $0.34 |
| 2 formation documents | $0.28 |
| **Total AI cost** | **~$4.00** |
| **Revenue** | **$19.00** |
| **Gross margin** | **~79%** |

### Launch Tier — Monthly AI Cost Per User (Very Heavy Use)

| Usage | Cost |
|-------|------|
| Unlimited — worst case estimate | ~$15–20 |
| **Revenue** | **$49.00** |
| **Gross margin** | **~60–70%** |

---

## Tier 1 — Validate (Free)

### Philosophy
Give founders just enough to feel the magic without triggering significant
AI spend. The goal is activation and habit formation, not monetization.
Free users should be able to fully validate one idea before hitting a wall.

### Limits

| Resource | Free Limit |
|----------|-----------|
| Ideas | 1 total |
| AI Validations | 1 per idea (lifetime, not resettable) |
| Chat messages | 5 per idea (lifetime, user messages) |
| Document types | PITCH_DECK only |
| Documents per idea | 1 total |
| Document regenerations | 0 (generate once, edit manually) |
| Market Research | ❌ Not available |
| Formation Navigator | ❌ Not available |
| Checklist | ✅ Manual only (no AI-draft) |
| Journey view | ✅ Read-only |
| Storage | 100 MB (Neon free tier) |
| Support | Community only |

### What IS Free (Zero Extra Cost)
These features cost nothing beyond database storage — give them generously:

- ✅ Full CRUD on ideas (up to 3)
- ✅ Encryption at rest (already in the codebase)
- ✅ JWT auth, secure login/logout
- ✅ Checklist phases (VALIDATE, BUILD, LAUNCH) — manual tracking
- ✅ Journey view overview
- ✅ Idea stage tracking (DRAFT → VALIDATED)
- ✅ Read existing documents (after generation)

### Upgrade Trigger
Free users hit the wall at:
1. Their 2nd idea attempt ("You're building momentum — go Build")
2. 6th chat message (mid-conversation, high intent moment)
3. Any click on Market Research or Formation
4. Any document type other than Pitch Deck

---

## Tier 2 — Build ($19/month)

### Philosophy
The workhorse tier for solo founders actively building. Covers all core AI
features with reasonable limits. Priced below the cost of one coffee meeting
with a mentor — but Claude is available 24/7.

### Limits

| Resource | Build Limit |
|----------|------------|
| Ideas | 10 total |
| AI Validations | 3 per idea per month |
| Chat messages | 100 per idea per month |
| Document types | All 6 types |
| Document generations | 10 per idea total |
| Document regenerations | ✅ Unlimited |
| Market Research | 2 per idea (one-time, re-run after 30 days) |
| Formation Navigator | ✅ Full access |
| Formation documents | 3 per formation profile |
| AI jurisdiction recommendation | ✅ Included |
| Compliance events | ✅ Full calendar |
| Checklist AI-draft | ✅ Included (can_ai_draft items) |
| Storage | 2 GB |
| Support | Email (48hr response) |

### What Unlocks at Build
- Market Research (the agentic 8-search Tavily + Claude pipeline)
- Full document generation suite (BUSINESS_PLAN, FINANCIAL_MODEL, LEGAL_CHECKLIST)
- Formation Navigator (incorporation planning end-to-end)
- Formation documents (Articles of Incorporation, Operating Agreement, etc.)
- Document regeneration (re-run AI on updated idea context)
- Validation re-runs (3x per month per idea, not once per lifetime)
- Expanded chat (100 messages vs 10)

---

## Tier 3 — Launch ($49/month)

### Philosophy
For founders who are serious — running validation experiments, pitching
investors, or actively incorporating. Unlimited AI, priority support, and
access to every power feature on the roadmap as it ships.

### Limits

| Resource | Launch Limit |
|----------|-------------|
| Ideas | Unlimited |
| AI Validations | Unlimited |
| Chat messages | Unlimited |
| Document types | All 6 types |
| Document generations | Unlimited |
| Document regenerations | Unlimited |
| Market Research | Unlimited (re-run anytime) |
| Formation Navigator | ✅ Full access |
| Formation documents | Unlimited |
| AI jurisdiction recommendation | Unlimited |
| Compliance events | ✅ Full calendar + reminders |
| Checklist AI-draft | Unlimited |
| Storage | 20 GB |
| Support | Priority email (12hr response) |

### Power Features (Launch Exclusive — from roadmap)
As roadmap features ship, these should be Launch-only on release, then
potentially trickle down to Build after 90 days:

| Feature | Plan File | Launch? |
|---------|-----------|---------|
| GTM Strategy Generator | 04-gtm-strategy-generator | ✅ Launch only |
| Investor Matching | 05-investor-matching | ✅ Launch only |
| Financial Model Builder | 07-financial-model-builder | ✅ Launch only |
| Legal Risk Scanner | 08-legal-risk-scanner | ✅ Launch only |
| Pitch Deck Feedback Loop | 09-pitch-deck-feedback-loop | ✅ Launch only |
| Compliance Autopilot | 10-compliance-autopilot | ✅ Launch only |
| Term Sheet Analyzer | 13-term-sheet-analyzer | ✅ Launch only |
| Customer Discovery Suite | 14-customer-discovery-suite | ✅ Build + Launch |
| Investor CRM + Pitch Tracker | 15-investor-crm-pitch-tracker | ✅ Launch only |
| Landing Page Copy Generator | 16-landing-page-copy-generator | ✅ Build + Launch |
| Async AI Interview | 12-async-ai-interview | ✅ Build + Launch |
| Idea Refinement Loop | 06-idea-refinement-loop | ✅ Build + Launch |
| Multi-Agent Validation | 03-multi-agent-validation | ✅ Launch only |
| Cohort Intelligence | 11-cohort-intelligence | ✅ Launch only |

---

## Feature Matrix

| Feature | Validate (Free) | Build ($19) | Launch ($49) |
|---------|:-:|:-:|:-:|
| Ideas | 1 | 10 | Unlimited |
| AI Validation | 1x / idea (lifetime) | 3x / idea / month | Unlimited |
| AI Chat | 5 msgs / idea (lifetime) | 100 msgs / idea / month | Unlimited |
| Pitch Deck generation | ✅ | ✅ | ✅ |
| MVP Spec generation | ❌ | ✅ | ✅ |
| Business Plan generation | ❌ | ✅ | ✅ |
| Financial Model generation | ❌ | ✅ | ✅ |
| Legal Checklist generation | ❌ | ✅ | ✅ |
| Market Research generation | ❌ | ✅ 2x / idea | ✅ Unlimited |
| Document regeneration | ❌ | ✅ | ✅ |
| Formation Navigator | ❌ | ✅ | ✅ |
| Formation Documents | ❌ | ✅ 3x | ✅ Unlimited |
| Compliance Calendar | ❌ | ✅ | ✅ |
| AI Jurisdiction Rec. | ❌ | ✅ | ✅ |
| Checklist AI-draft | ❌ | ✅ | ✅ |
| Journey View | ✅ Read-only | ✅ Full | ✅ Full |
| GTM Strategy | ❌ | ❌ | ✅ |
| Investor Matching | ❌ | ❌ | ✅ |
| Financial Model Builder | ❌ | ❌ | ✅ |
| Legal Risk Scanner | ❌ | ❌ | ✅ |
| Pitch Deck Feedback Loop | ❌ | ❌ | ✅ |
| Compliance Autopilot | ❌ | ❌ | ✅ |
| Multi-Agent Validation | ❌ | ❌ | ✅ |
| Term Sheet Analyzer | ❌ | ❌ | ✅ |
| Investor CRM | ❌ | ❌ | ✅ |
| Customer Discovery Suite | ❌ | ✅ | ✅ |
| Landing Page Copy Generator | ❌ | ✅ | ✅ |
| Async AI Interview | ❌ | ✅ | ✅ |
| Idea Refinement Loop | ❌ | ✅ | ✅ |
| Storage | 100 MB | 2 GB | 20 GB |
| Support | Community | Email 48hr | Priority 12hr |

---

## Annual Pricing Option (Optional)

Offer annual billing at 2 months free (~17% discount):

| Tier | Monthly | Annual (billed yearly) | Savings |
|------|---------|------------------------|---------|
| Validate | Free | Free | — |
| Build | $19/mo | $190/yr ($15.83/mo) | $38/yr |
| Launch | $49/mo | $490/yr ($40.83/mo) | $98/yr |

Annual billing improves cash flow and reduces churn — worth implementing
alongside or shortly after the monthly plan launches.

---

## Implementation Notes

### Database Changes Needed
Add to the `User` model:

```python
# New fields on User model
subscription_tier: str  # "validate" | "build" | "launch"
subscription_status: str  # "active" | "cancelled" | "past_due"
subscription_expires_at: datetime | None
stripe_customer_id: str | None
stripe_subscription_id: str | None

# Usage counters (reset monthly via cron)
validations_used_this_month: int  # per idea tracked in Idea model
chat_messages_used_this_month: int  # per idea
```

### Enforcement Layer
Add a `plan_guard` dependency (FastAPI `Depends`) that:
1. Reads `current_user.subscription_tier`
2. Checks usage counters before each AI endpoint
3. Returns `HTTP 402 Payment Required` with a clear upgrade message

Inject into routers:
- `POST /ideas/{id}/validate` — check validation quota
- `POST /ideas/{id}/chat/stream` — check chat quota
- `POST /ideas/{id}/documents` — check doc type + quota
- `POST /ideas/{id}/documents/market-research/stream` — Build+ only
- `POST /ideas/{id}/formation` — Build+ only

### Payment Integration
Stripe is the standard choice:
- `stripe.Checkout.Session` for subscription creation
- Webhooks: `customer.subscription.updated`, `invoice.payment_failed`
- Store `stripe_customer_id` and `stripe_subscription_id` on User

### Free Tier Infrastructure Cost (Neon + Upstash)
As long as total active free users stay under ~1,000 with low usage:
- Neon free: 0.5 GB — fine for early users
- Upstash free: 10K Redis commands/day — fine unless rate limiting fires constantly
- Anthropic API: ~$0.44/active user/month — only pay for what's used

There is **no fixed monthly infrastructure cost** on the free tier stack until
scale forces an upgrade. This means the first 100–200 free users cost
essentially $0 in infrastructure, and only the AI API usage is a real
variable cost.

---

## Recommended Launch Sequence

1. **Ship with Validate + Build only** — two tiers is simpler to explain and
   support. Add Launch tier once the roadmap features ship.
2. **No credit card for free tier** — friction kills top-of-funnel.
3. **Show usage meters in the UI** — "7 / 10 chat messages used" creates
   natural upgrade pressure without aggressive popups.
4. **Upgrade prompt on limit hit** — show modal mid-conversation or
   mid-generation, not after the user has already left.
5. **Grandfathering** — first 100 Build subscribers get lifetime pricing lock.
   Use as an early launch incentive.
