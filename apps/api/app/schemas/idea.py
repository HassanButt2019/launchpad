from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

from app.models.idea import IdeaStage


class IdeaCreate(BaseModel):
    title: str
    description: Optional[str] = None
    stage: IdeaStage = IdeaStage.DRAFT
    market_size: Optional[str] = None
    target_audience: Optional[str] = None
    problem_statement: Optional[str] = None
    unique_value_prop: Optional[str] = None


class IdeaUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    stage: Optional[IdeaStage] = None
    market_size: Optional[str] = None
    target_audience: Optional[str] = None
    problem_statement: Optional[str] = None
    unique_value_prop: Optional[str] = None


class IdeaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    stage: IdeaStage
    market_size: Optional[str] = None
    target_audience: Optional[str] = None
    problem_statement: Optional[str] = None
    unique_value_prop: Optional[str] = None
    created_at: datetime
    updated_at: datetime
