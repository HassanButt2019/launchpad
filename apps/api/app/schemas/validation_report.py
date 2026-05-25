from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class ValidationReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    idea_id: str
    score: int
    score_rationale: Optional[str] = None
    strengths: Optional[List[str]] = None
    weaknesses: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    competitive_landscape: Optional[str] = None
    market_opportunity: Optional[str] = None
    sources: Optional[List[str]] = None
    generated_at: datetime
