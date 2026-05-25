import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.formation import (
    FormationProfile,
    FormationChecklistItem,
    FormationDocument,
    ComplianceEvent,
)
from app.models.idea import Idea, IdeaStage
from app.models.user import User
from app.schemas.formation import (
    FormationCreate,
    FormationUpdate,
    FormationDocumentCreate,
    FormationProfileResponse,
    FormationDocumentResponse,
    ComplianceEventResponse,
    JurisdictionInfo,
    JurisdictionRecommendationRequest,
    JurisdictionRecommendation,
    JurisdictionRecommendationResponse,
)
from app.data.jurisdictions import JURISDICTIONS, COMPLIANCE_TEMPLATES
from app.config import settings


# ---------------------------------------------------------------------------
# Document content templates
# ---------------------------------------------------------------------------

DOCUMENT_TEMPLATES = {
    "CERTIFICATE_OF_INCORPORATION": """CERTIFICATE OF INCORPORATION
OF
[COMPANY_NAME]

FIRST: The name of this corporation is [COMPANY_NAME].

SECOND: Its registered office in the State of Delaware is to be located at [REGISTERED_OFFICE_ADDRESS]. The registered agent in charge thereof is [REGISTERED_AGENT].

THIRD: The purpose of the corporation is to engage in any lawful act or activity for which corporations may be organized under the General Corporation Law of Delaware.

FOURTH: The total number of shares of stock which the corporation is authorized to issue is [AUTHORIZED_SHARES] shares of Common Stock, each having a par value of $0.0001.

FIFTH: The name and mailing address of the incorporator are as follows:
Name: [INCORPORATOR_NAME]
Address: [INCORPORATOR_ADDRESS]

SIXTH: The board of directors is expressly empowered to adopt, amend, or repeal the bylaws of the corporation.

SEVENTH: The personal liability of the directors of the corporation is hereby eliminated to the fullest extent permitted by the General Corporation Law of Delaware, as the same exists or may hereafter be amended. Any repeal or modification of this Article SEVENTH shall not adversely affect any right or protection of a director of the corporation existing at the time of such repeal or modification.

EIGHTH: The corporation reserves the right to amend, alter, change or repeal any provision contained in this Certificate of Incorporation, in the manner now or hereafter prescribed by statute, and all rights conferred upon stockholders herein are granted subject to this reservation.

IN WITNESS WHEREOF, the undersigned, being the incorporator hereinabove named, has executed and acknowledged this Certificate of Incorporation this [DATE] day of [MONTH], [YEAR].

_________________________________
[INCORPORATOR_NAME], Incorporator
""",
    "ARTICLES_OF_INCORPORATION": """CERTIFICATE OF INCORPORATION
OF
[COMPANY_NAME]

FIRST: The name of this corporation is [COMPANY_NAME].

SECOND: Its registered office in the State of Delaware is to be located at [REGISTERED_OFFICE_ADDRESS]. The registered agent in charge thereof is [REGISTERED_AGENT].

THIRD: The purpose of the corporation is to engage in any lawful act or activity for which corporations may be organized under the General Corporation Law of Delaware.

FOURTH: The total number of shares of stock which the corporation is authorized to issue is [AUTHORIZED_SHARES] shares of Common Stock, each having a par value of $0.0001.

FIFTH: The name and mailing address of the incorporator are as follows:
Name: [INCORPORATOR_NAME]
Address: [INCORPORATOR_ADDRESS]

SIXTH: The board of directors is expressly empowered to adopt, amend, or repeal the bylaws of the corporation.

SEVENTH: The personal liability of the directors of the corporation is hereby eliminated to the fullest extent permitted by the General Corporation Law of Delaware, as the same exists or may hereafter be amended.

EIGHTH: The corporation reserves the right to amend, alter, change or repeal any provision contained in this Certificate of Incorporation, in the manner now or hereafter prescribed by statute.

IN WITNESS WHEREOF, the undersigned has executed this Certificate of Incorporation this [DATE] day of [MONTH], [YEAR].

_________________________________
[INCORPORATOR_NAME], Incorporator
""",
    "BYLAWS": """BYLAWS
OF
[COMPANY_NAME]

ARTICLE I — OFFICES

Section 1.1 Registered Office. The registered office of [COMPANY_NAME] (the "Corporation") shall be in the State of Delaware.

Section 1.2 Other Offices. The Corporation may have offices at such other places, both within and without the State of Delaware, as the Board of Directors may from time to time determine.

ARTICLE II — STOCKHOLDERS

Section 2.1 Annual Meetings. Annual meetings of stockholders shall be held at such date, time, and place as determined by the Board of Directors.

Section 2.2 Special Meetings. Special meetings of stockholders may be called by the Chairman of the Board, President, or a majority of the Board of Directors.

Section 2.3 Notice. Written notice of each meeting of stockholders shall be given not less than ten (10) nor more than sixty (60) days before the date of the meeting.

Section 2.4 Quorum. A majority of the outstanding shares entitled to vote, present in person or represented by proxy, shall constitute a quorum.

ARTICLE III — BOARD OF DIRECTORS

Section 3.1 Powers. The business and affairs of the Corporation shall be managed by the Board of Directors.

Section 3.2 Number. The Board of Directors shall consist of [NUMBER_OF_DIRECTORS] director(s), which number may be changed by resolution of the Board.

Section 3.3 Election. Directors shall be elected at each annual meeting of stockholders to hold office until the next annual meeting.

Section 3.4 Compensation. Directors may receive such compensation for their services as may be fixed by resolution of the Board.

ARTICLE IV — OFFICERS

Section 4.1 Officers. The officers of the Corporation shall include a President, Secretary, and Treasurer, and may include a Chairman of the Board, Vice Presidents, and other officers as the Board may designate.

Section 4.2 Appointment. Officers shall be appointed by the Board of Directors and shall serve at the pleasure of the Board.

Section 4.3 President. The President shall be the chief executive officer of the Corporation and shall have general supervision of the business of the Corporation.

ARTICLE V — SHARES OF STOCK

Section 5.1 Certificates. Shares of stock in the Corporation shall be represented by certificates or shall be uncertificated shares.

Section 5.2 Lost Certificates. The Board may direct a new certificate to be issued in place of any certificate alleged to have been lost, stolen, or destroyed.

ARTICLE VI — INDEMNIFICATION

Section 6.1 Right to Indemnification. The Corporation shall indemnify each person who was or is a party to any proceeding by reason of the fact that such person is or was a director or officer of the Corporation.

ARTICLE VII — AMENDMENTS

These Bylaws may be altered, amended, or repealed, or new bylaws may be adopted, by the Board of Directors.

Adopted by the Board of Directors of [COMPANY_NAME] on [DATE].

_________________________________
[SECRETARY_NAME], Secretary
""",
    "MOA": """MEMORANDUM OF ASSOCIATION
OF
[COMPANY_NAME]

1. NAME
The name of the Company is [COMPANY_NAME].

2. REGISTERED OFFICE
The Registered Office of the Company is to be situated at [REGISTERED_OFFICE_ADDRESS], [JURISDICTION].

3. OBJECTS
The objects for which the Company is established are:
3.1 To carry on the business of [BUSINESS_DESCRIPTION] and all activities incidental thereto.
3.2 To acquire, develop, sell, license, or otherwise deal in intellectual property rights of all kinds.
3.3 To enter into contracts, agreements, and arrangements of any kind.
3.4 To borrow money, grant security, and raise capital in any manner permitted by law.
3.5 To do all such other things as are incidental or conducive to the attainment of the above objects.

4. LIABILITY
The liability of the members is limited.

5. SHARE CAPITAL
The share capital of the Company is [CURRENCY] [SHARE_CAPITAL], divided into [NUMBER_OF_SHARES] shares of [CURRENCY] [PAR_VALUE] each.

6. DECLARATION
We, the undersigned, whose names and addresses are subscribed, are desirous of being formed into a Company in pursuance of this Memorandum of Association, and we respectively agree to take the number of shares in the capital of the Company set opposite our respective names.

Subscribers:
Name: [FOUNDER_1_NAME]
Address: [FOUNDER_1_ADDRESS]
Shares: [FOUNDER_1_SHARES]

Name: [FOUNDER_2_NAME]
Address: [FOUNDER_2_ADDRESS]
Shares: [FOUNDER_2_SHARES]

Dated this [DATE] day of [MONTH], [YEAR].

Witness: [WITNESS_NAME]
""",
    "MEMORANDUM_OF_ASSOCIATION": """MEMORANDUM OF ASSOCIATION
OF
[COMPANY_NAME]

1. NAME
The name of the Company is [COMPANY_NAME].

2. REGISTERED OFFICE
The Registered Office of the Company is to be situated at [REGISTERED_OFFICE_ADDRESS], [JURISDICTION].

3. OBJECTS
The objects for which the Company is established are:
3.1 To carry on the business of [BUSINESS_DESCRIPTION] and all activities incidental thereto.
3.2 To acquire, develop, sell, license, or otherwise deal in intellectual property rights of all kinds.
3.3 To enter into contracts and arrangements of any kind.
3.4 To borrow money, grant security, and raise capital in any lawful manner.
3.5 To do all such other things as are incidental to the attainment of the above objects.

4. LIABILITY
The liability of the members is limited.

5. SHARE CAPITAL
The share capital of the Company is [CURRENCY] [SHARE_CAPITAL], divided into [NUMBER_OF_SHARES] shares of [CURRENCY] [PAR_VALUE] each.

6. DECLARATION
We, the undersigned, are desirous of being formed into a Company in pursuance of this Memorandum of Association.

Subscribers:
Name: [FOUNDER_1_NAME] | Shares: [FOUNDER_1_SHARES]
Name: [FOUNDER_2_NAME] | Shares: [FOUNDER_2_SHARES]

Dated: [DATE]
""",
    "SHAREHOLDER_AGREEMENT": """SHAREHOLDERS AGREEMENT

THIS SHAREHOLDERS AGREEMENT (this "Agreement") is entered into as of [DATE], by and among [COMPANY_NAME], a [JURISDICTION] corporation (the "Company"), and the individuals and entities listed on Schedule A attached hereto (collectively, the "Shareholders").

RECITALS
WHEREAS, the Shareholders own shares of the Company's capital stock as set forth on Schedule A; and
WHEREAS, the parties desire to set forth their respective rights and obligations with respect to the Company.

1. GOVERNANCE

1.1 Board Composition. The Board of Directors shall consist of [NUMBER] members. [FOUNDER_NAME] shall have the right to designate [NUMBER] director(s) so long as they hold at least [PERCENTAGE]% of the outstanding shares.

1.2 Voting. All major decisions, including issuance of new shares, sale of the Company, and incurrence of debt above $[THRESHOLD], shall require approval of shareholders holding at least [MAJORITY_PERCENTAGE]% of the outstanding shares.

2. TRANSFER RESTRICTIONS

2.1 Right of First Refusal (ROFR). Prior to transferring any shares to a third party, a selling shareholder must first offer such shares to the Company and then to the other shareholders at the same price and terms.

2.2 Co-Sale Right (Tag-Along). If any shareholder proposes to sell shares to a third party, each other shareholder shall have the right to participate in such sale on a pro-rata basis.

2.3 Drag-Along Right. If shareholders holding at least [DRAG_THRESHOLD]% of the outstanding shares approve a sale of the Company, all other shareholders shall be required to vote in favor of and consent to such transaction.

3. VESTING

3.1 Founder Vesting. All founder shares shall be subject to a [VESTING_PERIOD]-year vesting schedule with a [CLIFF]-year cliff, vesting monthly thereafter.

3.2 Acceleration. Shares shall fully accelerate upon a Change of Control or involuntary termination without cause.

4. CONFIDENTIALITY

Each Shareholder agrees to maintain in strict confidence all non-public information concerning the Company and its business.

5. NON-COMPETE

During the term of their involvement with the Company and for [NON_COMPETE_PERIOD] months thereafter, each founder agrees not to engage in any business that directly competes with the Company's core business activities.

6. MISCELLANEOUS

6.1 Governing Law. This Agreement shall be governed by the laws of [GOVERNING_LAW_JURISDICTION].

6.2 Entire Agreement. This Agreement constitutes the entire agreement among the parties with respect to its subject matter.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

[COMPANY_NAME]
By: ____________________________
Name: [AUTHORIZED_SIGNATORY]
Title: [TITLE]

SHAREHOLDERS:
____________________________
[FOUNDER_1_NAME]

____________________________
[FOUNDER_2_NAME]
""",
    "FOUNDER_STOCK_PURCHASE_AGREEMENT": """FOUNDER STOCK PURCHASE AGREEMENT

This Founder Stock Purchase Agreement (the "Agreement") is entered into as of [DATE] between [COMPANY_NAME], a Delaware corporation (the "Company"), and [FOUNDER_NAME] ("Purchaser").

1. PURCHASE AND SALE

1.1 Purchase. The Company hereby sells and issues to Purchaser, and Purchaser hereby purchases from the Company, [NUMBER_OF_SHARES] shares of Common Stock (the "Shares") at a purchase price of $[PRICE_PER_SHARE] per share, for an aggregate purchase price of $[TOTAL_PRICE] (the "Purchase Price").

1.2 Payment. Purchaser shall pay the Purchase Price by [PAYMENT_METHOD] on or before [PAYMENT_DATE].

2. VESTING SCHEDULE

2.1 Vesting. The Shares shall vest as follows, subject to Purchaser's continuous service to the Company:
(a) No Shares shall vest before the one (1) year anniversary of [VESTING_START_DATE] (the "Cliff");
(b) Upon the Cliff, 25% of the Shares shall vest;
(c) Thereafter, 1/48 of the total Shares shall vest each month, such that 100% of the Shares are vested four (4) years from the Vesting Start Date.

2.2 Acceleration. In the event of a Change of Control (as defined in the Company's equity plan), [ACCELERATION_TERMS].

2.3 Repurchase Right. The Company shall have the right to repurchase any unvested Shares at the original Purchase Price upon termination of Purchaser's service.

3. RESTRICTIONS ON TRANSFER

3.1 Lock-Up. Purchaser shall not sell, transfer, or otherwise dispose of any Shares without the prior written consent of the Company until the earlier of: (i) the Company's IPO, or (ii) [LOCK_UP_PERIOD] months from the date hereof.

3.2 ROFR. All transfers of Shares are subject to a right of first refusal in favor of the Company and other shareholders.

4. SECTION 83(b) ELECTION

Purchaser understands that pursuant to Section 83(b) of the Internal Revenue Code, Purchaser may elect to be taxed on the fair market value of the Shares at the time of purchase rather than upon vesting. PURCHASER MUST FILE THE 83(b) ELECTION WITH THE IRS WITHIN 30 DAYS OF THE DATE OF THIS AGREEMENT OR THE RIGHT TO MAKE SUCH ELECTION WILL BE PERMANENTLY LOST.

5. REPRESENTATIONS

Purchaser represents and warrants that: (i) Purchaser is acquiring the Shares for investment purposes only; (ii) Purchaser is aware that the Shares are not registered under the Securities Act of 1933; and (iii) Purchaser has had the opportunity to ask questions and receive answers from the Company.

6. MISCELLANEOUS

6.1 Governing Law. This Agreement shall be governed by the laws of the State of Delaware.
6.2 Entire Agreement. This Agreement constitutes the entire agreement between the parties.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date written above.

[COMPANY_NAME]
By: ____________________________
Name: [AUTHORIZED_SIGNATORY], [TITLE]

PURCHASER:
____________________________
[FOUNDER_NAME]
Date: [DATE]
""",
    "IP_ASSIGNMENT": """INTELLECTUAL PROPERTY ASSIGNMENT AGREEMENT

This Intellectual Property Assignment Agreement (the "Agreement") is entered into as of [DATE], by and between [FOUNDER_NAME] ("Assignor") and [COMPANY_NAME], a [JURISDICTION] corporation ("Assignee").

RECITALS

WHEREAS, Assignor has conceived, developed, or contributed to certain intellectual property that is related to or useful in the business of the Company; and

WHEREAS, the parties desire that all such intellectual property be owned by the Company.

1. ASSIGNMENT

1.1 Prior IP Assignment. Assignor hereby irrevocably assigns, transfers, and conveys to the Company, its successors and assigns, all right, title, and interest throughout the world in and to all intellectual property ("Assigned IP") that:
(a) relates to the Company's current or reasonably anticipated business activities;
(b) was conceived, developed, or created by Assignor, whether alone or jointly with others, prior to or during Assignor's involvement with the Company; or
(c) results from any work performed by Assignor for or on behalf of the Company.

1.2 Scope of Assigned IP. "Assigned IP" includes without limitation: inventions, discoveries, improvements, trade secrets, software, source code, algorithms, designs, specifications, databases, trademarks, domain names, social media accounts, copyrights, and all applications and registrations therefor.

2. DISCLOSURE OBLIGATION

Assignor agrees to promptly disclose in writing to the Company any Assigned IP conceived or developed during the term of this Agreement.

3. FURTHER ASSISTANCE

Assignor agrees to execute, upon request by the Company, all documents and take all actions necessary to perfect the Company's ownership of the Assigned IP, including patent applications, copyright registrations, and assignments to any IP office worldwide.

4. MORAL RIGHTS WAIVER

To the extent permitted by applicable law, Assignor irrevocably waives and agrees not to exercise any "moral rights" or equivalent rights in the Assigned IP.

5. REPRESENTATIONS AND WARRANTIES

Assignor represents and warrants that: (i) Assignor has the full right to make this assignment; (ii) the Assigned IP does not infringe the intellectual property rights of any third party; and (iii) Assignor has not previously assigned, transferred, or encumbered the Assigned IP.

6. GOVERNING LAW

This Agreement shall be governed by the laws of [GOVERNING_LAW_JURISDICTION].

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

ASSIGNOR:
____________________________
[FOUNDER_NAME]
Date: [DATE]

ASSIGNEE:
[COMPANY_NAME]
By: ____________________________
Name: [AUTHORIZED_SIGNATORY]
Title: [TITLE]
Date: [DATE]
""",
}


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

async def _get_idea_for_user(idea_id: str, user_id: str, db: AsyncSession) -> Idea:
    result = await db.execute(
        select(Idea).where(Idea.id == idea_id, Idea.user_id == user_id)
    )
    idea = result.scalar_one_or_none()
    if idea is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Idea not found")
    return idea


async def _load_formation(formation_id: str, db: AsyncSession) -> FormationProfile:
    result = await db.execute(
        select(FormationProfile)
        .options(
            selectinload(FormationProfile.checklist_items),
            selectinload(FormationProfile.documents),
            selectinload(FormationProfile.compliance_events),
        )
        .where(FormationProfile.id == formation_id)
    )
    formation = result.scalar_one_or_none()
    if formation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formation profile not found")
    return formation


# ---------------------------------------------------------------------------
# Service functions
# ---------------------------------------------------------------------------

async def get_or_create_formation(
    idea_id: str, user: User, db: AsyncSession
) -> Optional[FormationProfileResponse]:
    await _get_idea_for_user(idea_id, user.id, db)

    result = await db.execute(
        select(FormationProfile)
        .options(
            selectinload(FormationProfile.checklist_items),
            selectinload(FormationProfile.documents),
            selectinload(FormationProfile.compliance_events),
        )
        .where(FormationProfile.idea_id == idea_id, FormationProfile.user_id == user.id)
        .order_by(FormationProfile.created_at.desc())
    )
    formation = result.scalar_one_or_none()
    if formation is None:
        return None
    return FormationProfileResponse.model_validate(formation)


async def start_formation(
    idea_id: str, data: FormationCreate, user: User, db: AsyncSession
) -> FormationProfileResponse:
    idea = await _get_idea_for_user(idea_id, user.id, db)

    # Validate jurisdiction
    jurisdiction_data = JURISDICTIONS.get(data.jurisdiction)
    if jurisdiction_data is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown jurisdiction: {data.jurisdiction}. Valid values: {', '.join(JURISDICTIONS.keys())}",
        )

    legal_structure = data.legal_structure or jurisdiction_data["legal_structure"]

    formation = FormationProfile(
        id=str(uuid.uuid4()),
        idea_id=idea_id,
        user_id=user.id,
        jurisdiction=data.jurisdiction,
        legal_structure=legal_structure,
        status="PLANNING",
    )
    db.add(formation)
    await db.flush()

    # Generate checklist items from jurisdiction data
    for item_data in jurisdiction_data.get("checklist", []):
        item = FormationChecklistItem(
            id=str(uuid.uuid4()),
            formation_id=formation.id,
            category=item_data["category"],
            title=item_data["title"],
            description=item_data["description"],
            is_required=item_data["is_required"],
            can_ai_draft=item_data["can_ai_draft"],
            official_link=item_data.get("official_link"),
            estimated_days=item_data.get("estimated_days", 0),
            completed=False,
            sort_order=item_data.get("sort_order", 0),
        )
        db.add(item)

    # Generate compliance events from templates
    compliance_templates = COMPLIANCE_TEMPLATES.get(data.jurisdiction, [])
    current_year = datetime.now(timezone.utc).year
    for template in compliance_templates:
        month = template.get("month", 12)
        day = template.get("day", 31)
        # If the due date has already passed this year, schedule for next year
        due_date = datetime(current_year, month, day, tzinfo=timezone.utc)
        if due_date < datetime.now(timezone.utc):
            due_date = datetime(current_year + 1, month, day, tzinfo=timezone.utc)

        event = ComplianceEvent(
            id=str(uuid.uuid4()),
            formation_id=formation.id,
            title=template["title"],
            description=template["description"],
            due_date=due_date,
            recurrence=template.get("recurrence"),
            completed=False,
            reminder_sent=False,
        )
        db.add(event)

    # Advance idea stage if it's still at VALIDATED
    if idea.stage == IdeaStage.VALIDATED:
        idea.stage = IdeaStage.BUILDING

    await db.flush()

    return await _load_formation(formation.id, db)


async def update_formation(
    formation_id: str, data: FormationUpdate, user: User, db: AsyncSession
) -> FormationProfileResponse:
    result = await db.execute(
        select(FormationProfile).where(
            FormationProfile.id == formation_id,
            FormationProfile.user_id == user.id,
        )
    )
    formation = result.scalar_one_or_none()
    if formation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formation profile not found")

    if data.status is not None:
        formation.status = data.status
        # If incorporated, update idea stage
        if data.status == "INCORPORATED":
            result2 = await db.execute(select(Idea).where(Idea.id == formation.idea_id))
            idea = result2.scalar_one_or_none()
            if idea:
                idea.stage = IdeaStage.INCORPORATED

    if data.incorporation_date is not None:
        formation.incorporation_date = data.incorporation_date

    formation.updated_at = datetime.now(timezone.utc)
    await db.flush()

    return await _load_formation(formation.id, db)


async def toggle_checklist_item(
    formation_id: str, item_id: str, completed: bool, user: User, db: AsyncSession
) -> FormationProfileResponse:
    # Verify ownership via formation -> idea -> user
    result = await db.execute(
        select(FormationProfile).where(
            FormationProfile.id == formation_id,
            FormationProfile.user_id == user.id,
        )
    )
    formation = result.scalar_one_or_none()
    if formation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formation profile not found")

    result = await db.execute(
        select(FormationChecklistItem).where(
            FormationChecklistItem.id == item_id,
            FormationChecklistItem.formation_id == formation_id,
        )
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist item not found")

    item.completed = completed
    item.completed_at = datetime.now(timezone.utc) if completed else None
    await db.flush()

    return await _load_formation(formation_id, db)


async def _generate_formation_doc_with_claude(
    doc_type: str,
    jurisdiction: str,
    legal_structure: str,
    idea_title: str,
    idea_description: str,
    idea_problem: str,
    idea_audience: str,
    idea_uvp: str,
) -> str:
    import anthropic

    jurisdiction_context = JURISDICTIONS.get(jurisdiction, {})
    jurisdiction_name = jurisdiction_context.get("name", jurisdiction)
    key_advantage = jurisdiction_context.get("key_advantage", "")
    key_risk = jurisdiction_context.get("key_risk", "")

    prompt = f"""You are an expert startup attorney specializing in {jurisdiction_name} corporate law.
Generate a professional, jurisdiction-specific **{doc_type}** document for the following startup:

**Business Context:**
- Company: {idea_title}
- Description: {idea_description}
- Problem Solved: {idea_problem}
- Target Audience: {idea_audience}
- Unique Value: {idea_uvp}

**Legal Context:**
- Jurisdiction: {jurisdiction_name}
- Legal Structure: {legal_structure}
- Key advantage of this jurisdiction: {key_advantage}
- Key risk: {key_risk}

**Instructions:**
- Generate a complete, professional-grade {doc_type} tailored to {jurisdiction_name} law
- Include all standard clauses and sections required for this document type in {jurisdiction_name}
- Use [COMPANY_NAME], [FOUNDER_NAME], [DATE], [REGISTERED_AGENT], [REGISTERED_ADDRESS] as placeholders where specific details are needed
- Add jurisdiction-specific clauses and requirements (e.g., Delaware DGCL provisions, UK Companies Act 2006, UAE Free Zone regulations, etc.)
- Include realistic, detailed content — not just headers and empty sections
- Format with clear headings and numbered sections
- Add a brief note at the top reminding the reader to have an attorney review before filing

Write the complete document now:"""

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


def _fallback_formation_doc(
    doc_type: str, jurisdiction: str, legal_structure: str, idea_title: str
) -> str:
    return f"""# {doc_type}
## {idea_title} — {jurisdiction} ({legal_structure})

> **Note:** This is a placeholder template. Replace all bracketed values with your actual information and have an attorney review before filing.

---

**Company Name:** [COMPANY_NAME]
**Jurisdiction:** {jurisdiction}
**Legal Structure:** {legal_structure}
**Date:** [DATE]

---

### Document Overview

This {doc_type} is prepared for **[COMPANY_NAME]**, a {legal_structure} incorporated in {jurisdiction}.

All parties involved should review this document carefully. Key placeholders to replace:

- `[COMPANY_NAME]` — Your registered company name
- `[FOUNDER_NAME]` — Full legal name of the founder(s)
- `[REGISTERED_ADDRESS]` — Official registered office address
- `[REGISTERED_AGENT]` — Name of the registered agent (if applicable)
- `[DATE]` — Execution date
- `[AUTHORIZED_SHARES]` — Total number of authorized shares
- `[SHARE_CAPITAL]` — Total authorized share capital amount

---

*This document was auto-generated as a starting template. Consult a qualified attorney in {jurisdiction} before filing.*
"""


async def generate_formation_document(
    formation_id: str, doc_type: str, user: User, db: AsyncSession
) -> FormationDocumentResponse:
    import logging
    logger = logging.getLogger(__name__)

    result = await db.execute(
        select(FormationProfile).where(
            FormationProfile.id == formation_id,
            FormationProfile.user_id == user.id,
        )
    )
    formation = result.scalar_one_or_none()
    if formation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formation profile not found")

    # Fetch associated idea for business context
    idea_result = await db.execute(
        select(Idea).where(Idea.id == formation.idea_id)
    )
    idea = idea_result.scalar_one_or_none()

    # Decrypt idea fields if available
    idea_title = idea_description = idea_problem = idea_audience = idea_uvp = ""
    if idea:
        try:
            from app.security.encryption import get_user_fernet, decrypt_field
            fernet = get_user_fernet(user.encryption_key_salt)
            idea_title       = decrypt_field(idea.title, fernet) or ""
            idea_description = decrypt_field(idea.description, fernet) or ""
            idea_problem     = decrypt_field(idea.problem_statement, fernet) or ""
            idea_audience    = decrypt_field(idea.target_audience, fernet) or ""
            idea_uvp         = decrypt_field(idea.unique_value_prop, fernet) or ""
        except Exception as e:
            logger.warning("Could not decrypt idea fields: %s", e)

    # Generate with Claude; fall back to template on failure
    content = None
    if settings.ANTHROPIC_API_KEY and settings.ANTHROPIC_API_KEY != "your-anthropic-api-key-here":
        try:
            content = await _generate_formation_doc_with_claude(
                doc_type=doc_type,
                jurisdiction=formation.jurisdiction,
                legal_structure=formation.legal_structure,
                idea_title=idea_title,
                idea_description=idea_description,
                idea_problem=idea_problem,
                idea_audience=idea_audience,
                idea_uvp=idea_uvp,
            )
        except Exception as e:
            logger.error("Claude formation document generation failed: %s", e)

    if not content:
        content = _fallback_formation_doc(
            doc_type=doc_type,
            jurisdiction=formation.jurisdiction,
            legal_structure=formation.legal_structure,
            idea_title=idea_title or "Your Company",
        )

    # Upsert: update existing doc or create new one
    existing_result = await db.execute(
        select(FormationDocument).where(
            FormationDocument.formation_id == formation_id,
            FormationDocument.doc_type == doc_type,
        )
    )
    existing = existing_result.scalar_one_or_none()
    version = (existing.version + 1) if existing else 1

    if existing:
        existing.content = content
        existing.status = "GENERATED"
        existing.version = version
        existing.generated_at = datetime.now(timezone.utc)
        await db.flush()
        await db.refresh(existing)
        return FormationDocumentResponse.model_validate(existing)

    doc = FormationDocument(
        id=str(uuid.uuid4()),
        formation_id=formation_id,
        doc_type=doc_type,
        jurisdiction=formation.jurisdiction,
        content=content,
        status="GENERATED",
        version=version,
        generated_at=datetime.now(timezone.utc),
    )
    db.add(doc)
    await db.flush()
    await db.refresh(doc)
    return FormationDocumentResponse.model_validate(doc)


async def get_formation_documents(
    formation_id: str, user: User, db: AsyncSession
) -> List[FormationDocumentResponse]:
    result = await db.execute(
        select(FormationProfile).where(
            FormationProfile.id == formation_id,
            FormationProfile.user_id == user.id,
        )
    )
    formation = result.scalar_one_or_none()
    if formation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formation profile not found")

    result = await db.execute(
        select(FormationDocument).where(FormationDocument.formation_id == formation_id)
    )
    docs = result.scalars().all()
    return [FormationDocumentResponse.model_validate(d) for d in docs]


async def toggle_compliance_event(
    formation_id: str, event_id: str, completed: bool, user: User, db: AsyncSession
) -> ComplianceEventResponse:
    result = await db.execute(
        select(FormationProfile).where(
            FormationProfile.id == formation_id,
            FormationProfile.user_id == user.id,
        )
    )
    formation = result.scalar_one_or_none()
    if formation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formation profile not found")

    result = await db.execute(
        select(ComplianceEvent).where(
            ComplianceEvent.id == event_id,
            ComplianceEvent.formation_id == formation_id,
        )
    )
    event = result.scalar_one_or_none()
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compliance event not found")

    event.completed = completed
    await db.flush()
    await db.refresh(event)
    return ComplianceEventResponse.model_validate(event)


async def get_compliance_events(
    formation_id: str, user: User, db: AsyncSession
) -> List[ComplianceEventResponse]:
    result = await db.execute(
        select(FormationProfile).where(
            FormationProfile.id == formation_id,
            FormationProfile.user_id == user.id,
        )
    )
    formation = result.scalar_one_or_none()
    if formation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formation profile not found")

    result = await db.execute(
        select(ComplianceEvent)
        .where(ComplianceEvent.formation_id == formation_id)
        .order_by(ComplianceEvent.due_date)
    )
    events = result.scalars().all()
    return [ComplianceEventResponse.model_validate(e) for e in events]


async def get_jurisdictions() -> List[JurisdictionInfo]:
    result = []
    for jdata in JURISDICTIONS.values():
        result.append(
            JurisdictionInfo(
                code=jdata["code"],
                name=jdata["name"],
                region=jdata["region"],
                legal_structure=jdata["legal_structure"],
                setup_cost_usd_min=jdata["setup_cost_usd_min"],
                setup_cost_usd_max=jdata["setup_cost_usd_max"],
                annual_cost_usd_min=jdata["annual_cost_usd_min"],
                annual_cost_usd_max=jdata["annual_cost_usd_max"],
                incorporation_days_min=jdata["incorporation_days_min"],
                incorporation_days_max=jdata["incorporation_days_max"],
                corporate_tax_rate=jdata["corporate_tax_rate"],
                foreign_ownership=jdata["foreign_ownership"],
                vc_fundable=jdata["vc_fundable"],
                remote_setup=jdata["remote_setup"],
                best_for=jdata["best_for"],
                key_advantage=jdata["key_advantage"],
                key_risk=jdata["key_risk"],
            )
        )
    return result


async def _recommend_with_claude(data: JurisdictionRecommendationRequest) -> list[dict]:
    import anthropic, json

    available = "\n".join(
        f"- {code}: {j['name']} ({j['legal_structure']}) | setup ${j['setup_cost_usd_min']}–${j['setup_cost_usd_max']} | {j['incorporation_days_min']}–{j['incorporation_days_max']} days | tax {j['corporate_tax_rate']} | VC: {j['vc_fundable']} | remote: {j['remote_setup']}"
        for code, j in JURISDICTIONS.items()
    )

    prompt = f"""You are a startup formation expert. A founder has submitted this profile:
- Founder location: {data.founder_location}
- Customer location: {data.customer_location}
- Business type: {data.business_type}
- Plans to raise VC funding: {data.plans_vc_funding}
- Prefers remote setup: {data.prefers_remote_setup}
- Prefers fully online operation: {data.prefers_full_online}

Available jurisdictions:
{available}

Return the top 3 best jurisdictions for this founder as a JSON array. Each item must have:
- jurisdiction_code: one of the codes above
- score: integer 0-100 (match quality)
- reasoning: 2-3 sentence explanation tailored specifically to this founder's situation

Respond with ONLY a valid JSON array, no markdown, no explanation."""

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=800,
        messages=[{"role": "user", "content": prompt}],
    )
    return json.loads(message.content[0].text)


async def recommend_jurisdictions(
    data: JurisdictionRecommendationRequest,
) -> JurisdictionRecommendationResponse:
    # Try Claude first, fall back to rule-based
    top_recs = None
    if settings.ANTHROPIC_API_KEY and settings.ANTHROPIC_API_KEY != "your-anthropic-api-key-here":
        try:
            top_recs = await _recommend_with_claude(data)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error("Claude recommendation failed: %s", e)

    if top_recs:
        recommendations = [
            JurisdictionRecommendation(
                jurisdiction_code=r["jurisdiction_code"],
                reasoning=r["reasoning"],
                score=r["score"],
            )
            for r in top_recs
            if r["jurisdiction_code"] in JURISDICTIONS
        ]
        top_3 = [r.jurisdiction_code for r in recommendations]
        jurisdictions = []
        for code in top_3:
            jdata = JURISDICTIONS[code]
            jurisdictions.append(
                JurisdictionInfo(
                    code=jdata["code"], name=jdata["name"], region=jdata["region"],
                    legal_structure=jdata["legal_structure"],
                    setup_cost_usd_min=jdata["setup_cost_usd_min"], setup_cost_usd_max=jdata["setup_cost_usd_max"],
                    annual_cost_usd_min=jdata["annual_cost_usd_min"], annual_cost_usd_max=jdata["annual_cost_usd_max"],
                    incorporation_days_min=jdata["incorporation_days_min"], incorporation_days_max=jdata["incorporation_days_max"],
                    corporate_tax_rate=jdata["corporate_tax_rate"], foreign_ownership=jdata["foreign_ownership"],
                    vc_fundable=jdata["vc_fundable"], remote_setup=jdata["remote_setup"],
                    best_for=jdata["best_for"], key_advantage=jdata["key_advantage"], key_risk=jdata["key_risk"],
                )
            )
        return JurisdictionRecommendationResponse(recommendations=recommendations, jurisdictions=jurisdictions)

    # Rule-based fallback
    scores: dict[str, int] = {code: 50 for code in JURISDICTIONS}
    reasoning: dict[str, list[str]] = {code: [] for code in JURISDICTIONS}

    founder_loc = (data.founder_location or "").lower()
    customer_loc = (data.customer_location or "").lower()
    business_type = (data.business_type or "").lower()

    # VC plans → Delaware is the standard
    if data.plans_vc_funding:
        scores["US_DELAWARE"] += 30
        reasoning["US_DELAWARE"].append("Delaware C-Corp is the industry standard for VC-backed startups.")
        scores["UK_LTD"] += 10
        reasoning["UK_LTD"].append("UK Ltd supports SEIS/EIS investor tax incentives.")
        scores["DE_GMBH"] += 5
        reasoning["DE_GMBH"].append("GmbH is suitable for EU VC funding rounds.")
        scores["EE_OU"] -= 15
        reasoning["EE_OU"].append("Estonian OÜ is generally not preferred by institutional VCs.")
        scores["US_WYOMING"] -= 20
        reasoning["US_WYOMING"].append("Wyoming LLC is not suitable for equity-based VC funding.")

    # Remote preference
    if data.prefers_remote_setup or data.prefers_full_online:
        scores["EE_OU"] += 25
        reasoning["EE_OU"].append("Estonia e-Residency enables fully remote incorporation with no physical presence required.")
        scores["US_WYOMING"] += 20
        reasoning["US_WYOMING"].append("Wyoming LLC can be set up entirely online with no physical presence required.")
        scores["US_DELAWARE"] += 10
        reasoning["US_DELAWARE"].append("Delaware C-Corp supports remote setup via Stripe Atlas or similar services.")
        scores["UAE_IFZA"] += 10
        reasoning["UAE_IFZA"].append("IFZA offers one of the most accessible UAE free zone setups with partial remote options.")
        scores["DE_GMBH"] -= 15
        reasoning["DE_GMBH"].append("German GmbH requires notarization and physical presence for setup.")
        scores["UAE_DUBAI_MAINLAND"] -= 10
        reasoning["UAE_DUBAI_MAINLAND"].append("UAE Mainland requires physical presence and office lease.")

    # UAE / Dubai-based founders
    if any(kw in founder_loc for kw in ["uae", "dubai", "abu dhabi", "sharjah", "gulf", "gcc"]):
        scores["UAE_DMCC"] += 30
        reasoning["UAE_DMCC"].append("DMCC is the premier UAE free zone for your region, with a world-class reputation.")
        scores["UAE_DIFC"] += 20
        reasoning["UAE_DIFC"].append("DIFC is ideal for financial services and high-value businesses in Dubai.")
        scores["UAE_IFZA"] += 20
        reasoning["UAE_IFZA"].append("IFZA offers cost-effective UAE incorporation for your location.")
        scores["UAE_DUBAI_MAINLAND"] += 15
        reasoning["UAE_DUBAI_MAINLAND"].append("Dubai Mainland is the best choice if you plan to trade directly with UAE consumers.")

    # European founders
    if any(kw in founder_loc for kw in ["germany", "german", "uk", "england", "france", "spain", "italy", "europe", "eu", "netherlands", "holland", "estonia"]):
        scores["UK_LTD"] += 20
        reasoning["UK_LTD"].append("UK Ltd is fast, cheap, and well-recognized for European-based founders.")
        scores["NL_BV"] += 15
        reasoning["NL_BV"].append("Dutch BV is excellent for EU headquarters and has strong international tax treaties.")
        scores["DE_GMBH"] += 10
        reasoning["DE_GMBH"].append("German GmbH carries strong credibility for DACH-region business.")
        scores["EE_OU"] += 15
        reasoning["EE_OU"].append("Estonian e-Residency is popular among European digital entrepreneurs.")

    # US-based founders or US customer focus
    if any(kw in founder_loc for kw in ["us", "usa", "united states", "america"]) or any(kw in customer_loc for kw in ["us", "usa", "united states", "america"]):
        scores["US_DELAWARE"] += 25
        reasoning["US_DELAWARE"].append("Delaware is the default choice for US-based founders and US market focus.")
        scores["US_WYOMING"] += 10
        reasoning["US_WYOMING"].append("Wyoming LLC is ideal for US-based solo founders seeking low cost and strong privacy.")

    # UK-focused customer base
    if any(kw in customer_loc for kw in ["uk", "england", "britain", "london"]):
        scores["UK_LTD"] += 20
        reasoning["UK_LTD"].append("UK Ltd provides direct access to the UK market with local credibility.")

    # Financial services or fintech
    if any(kw in business_type for kw in ["fintech", "finance", "financial", "banking", "investment", "fund", "asset management", "crypto", "blockchain"]):
        scores["UAE_DIFC"] += 25
        reasoning["UAE_DIFC"].append("DIFC is the premier financial hub in the region with English common law courts and a world-class regulator (DFSA).")
        scores["UAE_DMCC"] += 15
        reasoning["UAE_DMCC"].append("DMCC is well-suited for fintech and crypto businesses in the UAE.")
        scores["UK_LTD"] += 10
        reasoning["UK_LTD"].append("UK is a global fintech hub with FCA regulation and strong financial infrastructure.")

    # Commodities or trading
    if any(kw in business_type for kw in ["commodities", "trading", "import", "export", "logistics", "supply chain"]):
        scores["UAE_DMCC"] += 25
        reasoning["UAE_DMCC"].append("DMCC is the world's largest commodities hub and is purpose-built for trading companies.")

    # SaaS or tech
    if any(kw in business_type for kw in ["saas", "software", "tech", "app", "platform", "ai", "ml", "data"]):
        scores["US_DELAWARE"] += 15
        reasoning["US_DELAWARE"].append("Delaware C-Corp is strongly preferred by US SaaS investors and acquirers.")
        scores["EE_OU"] += 10
        reasoning["EE_OU"].append("Estonia is a digital-first country with excellent infrastructure for SaaS businesses.")
        scores["UAE_IFZA"] += 10
        reasoning["UAE_IFZA"].append("IFZA is cost-effective for tech startups seeking a UAE presence.")

    # Cap scores at 100, floor at 0
    for code in scores:
        scores[code] = max(0, min(100, scores[code]))

    # Sort by score descending and take top 3
    sorted_codes = sorted(scores.keys(), key=lambda c: scores[c], reverse=True)
    top_3 = sorted_codes[:3]

    recommendations = []
    for code in top_3:
        reason_parts = reasoning[code]
        if not reason_parts:
            reason_parts = [f"{JURISDICTIONS[code]['name']} is a suitable option for your business profile."]
        recommendations.append(
            JurisdictionRecommendation(
                jurisdiction_code=code,
                reasoning=" ".join(reason_parts),
                score=scores[code],
            )
        )

    # Include JurisdictionInfo for the top 3
    jurisdictions = []
    for code in top_3:
        jdata = JURISDICTIONS[code]
        jurisdictions.append(
            JurisdictionInfo(
                code=jdata["code"],
                name=jdata["name"],
                region=jdata["region"],
                legal_structure=jdata["legal_structure"],
                setup_cost_usd_min=jdata["setup_cost_usd_min"],
                setup_cost_usd_max=jdata["setup_cost_usd_max"],
                annual_cost_usd_min=jdata["annual_cost_usd_min"],
                annual_cost_usd_max=jdata["annual_cost_usd_max"],
                incorporation_days_min=jdata["incorporation_days_min"],
                incorporation_days_max=jdata["incorporation_days_max"],
                corporate_tax_rate=jdata["corporate_tax_rate"],
                foreign_ownership=jdata["foreign_ownership"],
                vc_fundable=jdata["vc_fundable"],
                remote_setup=jdata["remote_setup"],
                best_for=jdata["best_for"],
                key_advantage=jdata["key_advantage"],
                key_risk=jdata["key_risk"],
            )
        )

    return JurisdictionRecommendationResponse(
        recommendations=recommendations,
        jurisdictions=jurisdictions,
    )
