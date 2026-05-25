from typing import List
from fastapi import APIRouter, Depends, Request, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.idea import IdeaCreate, IdeaUpdate, IdeaResponse
from app.schemas.validation_report import ValidationReportResponse
from app.schemas.document import DocumentCreate, DocumentResponse, DocumentDetailResponse
from app.schemas.checklist import ChecklistResponse
from app.services import idea_service, validation_service, document_service, checklist_service
from app.services import market_research_service
from app.services import plan_guard
from app.security.middleware import limiter

router = APIRouter(prefix="/ideas", tags=["ideas"])


@router.get("", response_model=List[IdeaResponse])
@limiter.limit("60/minute")
async def list_ideas(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await idea_service.get_ideas(current_user, db)


@router.post("", response_model=IdeaResponse, status_code=201)
@limiter.limit("30/minute")
async def create_idea(
    request: Request,
    data: IdeaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await plan_guard.guard_create_idea(current_user, db)
    return await idea_service.create_idea(data, current_user, db)


@router.get("/{idea_id}", response_model=IdeaResponse)
@limiter.limit("60/minute")
async def get_idea(
    request: Request,
    idea_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await idea_service.get_idea(idea_id, current_user, db)


@router.put("/{idea_id}", response_model=IdeaResponse)
@limiter.limit("30/minute")
async def update_idea(
    request: Request,
    idea_id: str,
    data: IdeaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await idea_service.update_idea(idea_id, data, current_user, db)


@router.delete("/{idea_id}", status_code=204)
@limiter.limit("20/minute")
async def delete_idea(
    request: Request,
    idea_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await idea_service.delete_idea(idea_id, current_user, db)


@router.post("/{idea_id}/validate", response_model=ValidationReportResponse, status_code=201)
@limiter.limit("10/minute")
async def validate_idea(
    request: Request,
    idea_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await plan_guard.guard_validation(current_user, idea_id, db)
    return await validation_service.trigger_validation(idea_id, current_user, db)


@router.get("/{idea_id}/validation", response_model=ValidationReportResponse)
@limiter.limit("60/minute")
async def get_validation(
    request: Request,
    idea_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await validation_service.get_validation_report(idea_id, current_user, db)


@router.post("/{idea_id}/documents/market-research/stream")
@limiter.limit("5/minute")
async def stream_market_research(
    request: Request,
    idea_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Start an agentic market research run and stream progress + report as SSE.

    Events:
      data: {"type": "progress", "step": "...", "message": "..."}
      data: {"type": "chunk",    "content": "..."}
      data: {"type": "done",     "doc_id": "..."}
      data: {"type": "error",    "message": "..."}
    """
    plan_guard.guard_market_research(current_user)
    from app.config import settings
    if not settings.ANTHROPIC_API_KEY or settings.ANTHROPIC_API_KEY == "your-anthropic-api-key-here":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured.",
        )

    return StreamingResponse(
        market_research_service.stream_market_research(
            idea_id=idea_id,
            user=current_user,
            db=db,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/{idea_id}/documents", response_model=List[DocumentResponse])
@limiter.limit("60/minute")
async def list_documents(
    request: Request,
    idea_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await document_service.get_documents(idea_id, current_user, db)


@router.post("/{idea_id}/documents", response_model=DocumentDetailResponse, status_code=201)
@limiter.limit("20/minute")
async def create_document(
    request: Request,
    idea_id: str,
    data: DocumentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan_guard.guard_document_type(current_user, data.doc_type)
    return await document_service.create_document(idea_id, data, current_user, db)


@router.get("/{idea_id}/documents/{doc_id}", response_model=DocumentDetailResponse)
@limiter.limit("60/minute")
async def get_document(
    request: Request,
    idea_id: str,
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await document_service.get_document(idea_id, doc_id, current_user, db)


@router.put("/{idea_id}/documents/{doc_id}", response_model=DocumentDetailResponse)
@limiter.limit("20/minute")
async def update_document(
    request: Request,
    idea_id: str,
    doc_id: str,
    data: DocumentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.schemas.document import DocumentUpdate
    update_data = DocumentUpdate(content=data.content)
    return await document_service.update_document(idea_id, doc_id, update_data, current_user, db)


@router.get("/{idea_id}/checklist", response_model=List[ChecklistResponse])
@limiter.limit("60/minute")
async def get_checklist(
    request: Request,
    idea_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await checklist_service.get_or_create_checklists(idea_id, current_user, db)


@router.patch("/{idea_id}/checklist/{item_id}", response_model=ChecklistResponse)
@limiter.limit("60/minute")
async def update_checklist_item(
    request: Request,
    idea_id: str,
    item_id: int,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.schemas.checklist import ChecklistItemUpdate
    update = ChecklistItemUpdate(completed=data.get("completed", False))
    return await checklist_service.update_checklist_item(idea_id, item_id, update, current_user, db)


@router.get("/{idea_id}/journey")
@limiter.limit("30/minute")
async def get_journey(
    request: Request,
    idea_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    idea = await idea_service.get_idea(idea_id, current_user, db)
    checklists = await checklist_service.get_or_create_checklists(idea_id, current_user, db)

    try:
        validation = await validation_service.get_validation_report(idea_id, current_user, db)
    except Exception:
        validation = None

    docs = await document_service.get_documents(idea_id, current_user, db)

    checklist_summary = []
    for cl in checklists:
        items = cl.items or []
        total = len(items)
        completed = sum(1 for item in items if item.get("completed"))
        checklist_summary.append({
            "phase": cl.phase,
            "total": total,
            "completed": completed,
            "progress_pct": round((completed / total * 100) if total else 0, 1),
        })

    return {
        "idea": idea,
        "validation_report": validation,
        "documents_count": len(docs),
        "checklist_progress": checklist_summary,
    }
