from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class FormationCreate(BaseModel):
    jurisdiction: str
    legal_structure: Optional[str] = None


class FormationUpdate(BaseModel):
    status: Optional[str] = None
    incorporation_date: Optional[datetime] = None


class FormationChecklistItemUpdate(BaseModel):
    completed: bool


class FormationDocumentCreate(BaseModel):
    doc_type: str
    jurisdiction: str


class ComplianceEventUpdate(BaseModel):
    completed: bool


class FormationChecklistItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    formation_id: str
    category: str
    title: str
    description: str
    is_required: bool
    can_ai_draft: bool
    official_link: Optional[str]
    estimated_days: int
    completed: bool
    completed_at: Optional[datetime]
    sort_order: int


class FormationDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    formation_id: str
    doc_type: str
    jurisdiction: str
    status: str
    version: int
    generated_at: datetime
    content: Optional[str] = None


class ComplianceEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    formation_id: str
    title: str
    description: str
    due_date: datetime
    recurrence: Optional[str]
    completed: bool
    reminder_sent: bool


class FormationProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    idea_id: str
    user_id: str
    jurisdiction: str
    legal_structure: str
    status: str
    incorporation_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    checklist_items: List[FormationChecklistItemResponse] = []
    documents: List[FormationDocumentResponse] = []
    compliance_events: List[ComplianceEventResponse] = []


class JurisdictionInfo(BaseModel):
    code: str
    name: str
    region: str
    legal_structure: str
    setup_cost_usd_min: int
    setup_cost_usd_max: int
    annual_cost_usd_min: int
    annual_cost_usd_max: int
    incorporation_days_min: int
    incorporation_days_max: int
    corporate_tax_rate: str
    foreign_ownership: bool
    vc_fundable: bool
    remote_setup: bool
    best_for: str
    key_advantage: str
    key_risk: str


class JurisdictionRecommendationRequest(BaseModel):
    founder_location: str
    customer_location: str
    business_type: str
    plans_vc_funding: bool
    prefers_remote_setup: bool = False
    prefers_full_online: bool = False
    revenue_estimate: Optional[str] = None


class JurisdictionRecommendation(BaseModel):
    jurisdiction_code: str
    reasoning: str
    score: int  # 0-100


class JurisdictionRecommendationResponse(BaseModel):
    recommendations: List[JurisdictionRecommendation]
    jurisdictions: List[JurisdictionInfo]
