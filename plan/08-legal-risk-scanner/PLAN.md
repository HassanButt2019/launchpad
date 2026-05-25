# Feature 08 — Legal Risk Scanner

**Priority:** 8 of 13 | **Effort:** Low | **Impact:** ⚡ High

## What It Is
Before or during formation, AI scans the idea description for legal and regulatory risks specific to the chosen jurisdiction. It generates a risk register with severity ratings, jurisdiction-specific blockers, and mitigation steps.

## Why It Matters
- Legal surprises kill startups post-launch (surprise licensing requirements, IP conflicts, data privacy violations)
- Founders rarely think about regulation early enough
- Low effort — reuses existing Claude setup, no new infra
- High perceived value — feels like getting free legal advice

## Risk Categories Scanned

- **Licensing requirements** (fintech needs banking license, healthcare needs HIPAA/FDA, crypto needs MSB registration)
- **Data privacy** (GDPR if EU users, CCPA if California users, PDPA for UAE/Singapore)
- **IP conflicts** (name trademark conflicts, patent landscape)
- **Sector-specific regulation** (food, pharmaceuticals, education, real estate, insurance)
- **Employment law** (contractor vs employee, jurisdiction-specific requirements)
- **Consumer protection** (subscription auto-renewal laws, refund obligations)
- **Cross-border issues** (selling in US from UAE, data residency requirements)

## Output Format

```markdown
# Legal Risk Report: [Idea Name]
Jurisdiction: Delaware C-Corp | Target Market: US + EU

## 🔴 High Risk
### GDPR Compliance Required
You plan to serve EU customers. GDPR applies from day one.
**Required actions:**
- Appoint a Data Protection Officer (if processing at scale)
- Create a Privacy Policy and Cookie Policy
- Implement data deletion workflows
**Timeline:** Before launch
**Cost estimate:** $2,000–$5,000 (legal setup)

## 🟡 Medium Risk  
### Financial Services Classification
Your payment processing feature may trigger money transmitter regulations.
...

## 🟢 Low Risk / Informational
### Trademark Search Recommended
...

## Next Steps
1. Consult a startup attorney in Delaware
2. Review GDPR requirements at gdpr.eu
3. File trademark application for your brand name
```

## Architecture

### Backend
**New service function in `legal_service.py`** (or add to `document_service.py`):

```python
async def scan_legal_risks(idea, jurisdiction, target_markets):
    prompt = f"""You are a startup attorney specializing in {jurisdiction} law.
    
    Analyze this startup idea for legal and regulatory risks:
    Idea: {idea.title} — {idea.description}
    Problem: {idea.problem_statement}
    Target audience: {idea.target_audience}
    Jurisdiction of incorporation: {jurisdiction}
    
    Identify ALL legal risks across: licensing, data privacy, IP, sector regulation,
    employment, consumer protection, cross-border.
    
    For each risk provide: severity (HIGH/MEDIUM/LOW), description, required actions,
    timeline, and cost estimate. Be specific to {jurisdiction} law."""
```

Add `LEGAL_RISK_SCAN` to DocumentType or create a separate `LegalRiskReport` model.

### Frontend
- Add "Legal Risk Scan" card to the idea detail Quick Actions panel
- Or surface it during the formation wizard flow ("Before you incorporate, scan for risks")
- Show risks as colored cards (red/amber/green) with expandable details
- "Generate Full Legal Risk Report" button → creates a document

## Files to Create/Modify
- `apps/api/app/services/legal_service.py` (new)
- `apps/api/app/routers/legal.py` (new) OR add endpoint to formation router
- `apps/web/src/app/(dashboard)/ideas/[id]/legal-scan/page.tsx` (new)

## Estimated Dev Time
1–2 days
