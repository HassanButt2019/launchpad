# LaunchPad — AI Features Roadmap

> 13 advanced AI & agentic features to make LaunchPad the most powerful startup platform.

## Implementation Order (by impact-to-effort)

| # | Feature | Effort | Impact | Status |
|---|---------|--------|--------|--------|
| 01 | [AI Co-Founder Chat](./01-ai-cofounder-chat/PLAN.md) | Low | 🔥 Critical | Not started |
| 02 | [Agentic Market Research](./02-agentic-market-research/PLAN.md) | Medium | 🔥 Critical | Not started |
| 03 | [Multi-Agent Validation Pipeline](./03-multi-agent-validation/PLAN.md) | Medium | 🔥 Critical | Not started |
| 04 | [Go-to-Market Strategy Generator](./04-gtm-strategy-generator/PLAN.md) | Low | ⚡ High | Not started |
| 05 | [Investor Matching & Outreach](./05-investor-matching/PLAN.md) | High | ⚡ High | Not started |
| 06 | [Idea Refinement Loop](./06-idea-refinement-loop/PLAN.md) | Medium | ⚡ High | Not started |
| 07 | [Financial Model Builder](./07-financial-model-builder/PLAN.md) | Medium | ⚡ High | Not started |
| 08 | [Legal Risk Scanner](./08-legal-risk-scanner/PLAN.md) | Low | ⚡ High | Not started |
| 09 | [Pitch Deck Feedback Loop](./09-pitch-deck-feedback-loop/PLAN.md) | Low | 💡 Medium | Not started |
| 10 | [Compliance Autopilot](./10-compliance-autopilot/PLAN.md) | Medium | 💡 Medium | Not started |
| 11 | [Cohort Intelligence](./11-cohort-intelligence/PLAN.md) | High | 💡 Medium | Not started |
| 12 | [Async AI Interview](./12-async-ai-interview/PLAN.md) | Medium | 💡 Medium | Not started |
| 13 | [Term Sheet Analyzer](./13-term-sheet-analyzer/PLAN.md) | Low | 💡 Medium | Not started |

## Guiding Principles

- Every feature should use **Claude as the reasoning engine** (claude-sonnet-4-6 for complex reasoning, claude-haiku-4-5 for fast generation)
- Prefer **agentic patterns** (tool use, multi-step reasoning) over single prompt → single output
- All AI outputs should be **editable by the user** — AI drafts, human refines
- **No fake data** — if real web data is needed, use web search tools; never fabricate statistics
