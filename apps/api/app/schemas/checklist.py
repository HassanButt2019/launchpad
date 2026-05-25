from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict

from app.models.checklist import ChecklistPhase


class ChecklistItemUpdate(BaseModel):
    completed: bool


class ChecklistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    idea_id: str
    phase: ChecklistPhase
    items: Optional[List[Any]] = None
    created_at: datetime
