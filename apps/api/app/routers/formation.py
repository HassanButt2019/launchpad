from typing import List, Optional
from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.formation import (
    FormationCreate,
    FormationUpdate,
    FormationChecklistItemUpdate,
    FormationDocumentCreate,
    ComplianceEventUpdate,
    FormationProfileResponse,
    FormationDocumentResponse,
    ComplianceEventResponse,
    JurisdictionInfo,
    JurisdictionRecommendationRequest,
    JurisdictionRecommendationResponse,
)
from app.services import formation_service
from app.services import plan_guard
from app.security.middleware import limiter


# ---------------------------------------------------------------------------
# Two routers — one for /formation (jurisdictions) and one nested under /ideas
# ---------------------------------------------------------------------------

formation_router = APIRouter(prefix="/formation", tags=["formation"])
ideas_formation_router = APIRouter(prefix="/ideas", tags=["formation"])


# ---------------------------------------------------------------------------
# Jurisdiction endpoints
# ---------------------------------------------------------------------------

@formation_router.get("/jurisdictions", response_model=List[JurisdictionInfo])
@limiter.limit("60/minute")
async def list_jurisdictions(request: Request):
    return await formation_service.get_jurisdictions()


@formation_router.post("/jurisdictions/recommend", response_model=JurisdictionRecommendationResponse)
@limiter.limit("30/minute")
async def recommend_jurisdictions(
    request: Request,
    data: JurisdictionRecommendationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    plan_guard.guard_formation(current_user)
    return await formation_service.recommend_jurisdictions(data)


# ---------------------------------------------------------------------------
# Formation profile endpoints (nested under /ideas/{idea_id}/formation)
# ---------------------------------------------------------------------------

@ideas_formation_router.get(
    "/{idea_id}/formation",
    response_model=Optional[FormationProfileResponse],
)
@limiter.limit("60/minute")
async def get_formation(
    request: Request,
    idea_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await formation_service.get_or_create_formation(idea_id, current_user, db)


@ideas_formation_router.post(
    "/{idea_id}/formation",
    response_model=FormationProfileResponse,
    status_code=201,
)
@limiter.limit("30/minute")
async def start_formation(
    request: Request,
    idea_id: str,
    data: FormationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan_guard.guard_formation(current_user)
    return await formation_service.start_formation(idea_id, data, current_user, db)


@ideas_formation_router.put(
    "/{idea_id}/formation",
    response_model=FormationProfileResponse,
)
@limiter.limit("30/minute")
async def update_formation(
    request: Request,
    idea_id: str,
    data: FormationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Resolve formation_id from idea_id
    profile = await formation_service.get_or_create_formation(idea_id, current_user, db)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No formation profile found for this idea. Start formation first.",
        )
    return await formation_service.update_formation(profile.id, data, current_user, db)


@ideas_formation_router.patch(
    "/{idea_id}/formation/checklist/{item_id}",
    response_model=FormationProfileResponse,
)
@limiter.limit("60/minute")
async def toggle_checklist_item(
    request: Request,
    idea_id: str,
    item_id: str,
    data: FormationChecklistItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await formation_service.get_or_create_formation(idea_id, current_user, db)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No formation profile found for this idea.",
        )
    return await formation_service.toggle_checklist_item(
        profile.id, item_id, data.completed, current_user, db
    )


@ideas_formation_router.get(
    "/{idea_id}/formation/documents",
    response_model=List[FormationDocumentResponse],
)
@limiter.limit("60/minute")
async def list_formation_documents(
    request: Request,
    idea_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await formation_service.get_or_create_formation(idea_id, current_user, db)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No formation profile found for this idea.",
        )
    return await formation_service.get_formation_documents(profile.id, current_user, db)


@ideas_formation_router.post(
    "/{idea_id}/formation/documents",
    response_model=FormationDocumentResponse,
    status_code=201,
)
@limiter.limit("20/minute")
async def generate_formation_document(
    request: Request,
    idea_id: str,
    data: FormationDocumentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan_guard.guard_formation(current_user)
    profile = await formation_service.get_or_create_formation(idea_id, current_user, db)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No formation profile found for this idea.",
        )
    return await formation_service.generate_formation_document(
        profile.id, data.doc_type, current_user, db
    )


@ideas_formation_router.get(
    "/{idea_id}/formation/compliance",
    response_model=List[ComplianceEventResponse],
)
@limiter.limit("60/minute")
async def list_compliance_events(
    request: Request,
    idea_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await formation_service.get_or_create_formation(idea_id, current_user, db)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No formation profile found for this idea.",
        )
    return await formation_service.get_compliance_events(profile.id, current_user, db)


@ideas_formation_router.patch(
    "/{idea_id}/formation/compliance/{event_id}",
    response_model=ComplianceEventResponse,
)
@limiter.limit("60/minute")
async def toggle_compliance_event(
    request: Request,
    idea_id: str,
    event_id: str,
    data: ComplianceEventUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await formation_service.get_or_create_formation(idea_id, current_user, db)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No formation profile found for this idea.",
        )
    return await formation_service.toggle_compliance_event(
        profile.id, event_id, data.completed, current_user, db
    )
