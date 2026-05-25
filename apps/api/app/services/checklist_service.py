import uuid
import copy
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.checklist import Checklist, ChecklistPhase
from app.models.idea import Idea
from app.models.user import User
from app.schemas.checklist import ChecklistResponse, ChecklistItemUpdate
from app.utils.startup_data import CHECKLIST_TEMPLATES


async def _verify_idea_ownership(idea_id: str, user_id: str, db: AsyncSession) -> None:
    result = await db.execute(select(Idea).where(Idea.id == idea_id, Idea.user_id == user_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Idea not found")


async def get_or_create_checklists(idea_id: str, user: User, db: AsyncSession) -> List[ChecklistResponse]:
    await _verify_idea_ownership(idea_id, user.id, db)

    result = await db.execute(select(Checklist).where(Checklist.idea_id == idea_id))
    existing = {cl.phase: cl for cl in result.scalars().all()}

    checklists = []
    for phase in ChecklistPhase:
        if phase not in existing:
            template_items = copy.deepcopy(CHECKLIST_TEMPLATES.get(phase.value, []))
            cl = Checklist(
                id=str(uuid.uuid4()),
                idea_id=idea_id,
                phase=phase,
                items=template_items,
            )
            db.add(cl)
            await db.flush()
            await db.refresh(cl)
            checklists.append(cl)
        else:
            checklists.append(existing[phase])

    return [ChecklistResponse.model_validate(cl) for cl in checklists]


async def update_checklist_item(
    idea_id: str,
    item_id: int,
    data: ChecklistItemUpdate,
    user: User,
    db: AsyncSession,
) -> ChecklistResponse:
    await _verify_idea_ownership(idea_id, user.id, db)

    # item_id is treated as a global index across phases: 0-7 VALIDATE, 8-15 BUILD, 16-23 LAUNCH
    phase_size = 8
    phases = list(ChecklistPhase)
    phase_index = item_id // phase_size
    local_index = item_id % phase_size

    if phase_index >= len(phases):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist item not found")

    phase = phases[phase_index]
    result = await db.execute(
        select(Checklist).where(Checklist.idea_id == idea_id, Checklist.phase == phase)
    )
    checklist = result.scalar_one_or_none()
    if checklist is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist not found")

    items = list(checklist.items or [])
    if local_index >= len(items):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist item not found")

    items[local_index]["completed"] = data.completed
    checklist.items = items

    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(checklist, "items")

    await db.flush()
    await db.refresh(checklist)
    return ChecklistResponse.model_validate(checklist)
