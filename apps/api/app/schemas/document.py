from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

from app.models.document import DocumentType


class DocumentCreate(BaseModel):
    doc_type: DocumentType
    content: Optional[str] = None
    jurisdiction: Optional[str] = None


class DocumentUpdate(BaseModel):
    content: Optional[str] = None
    status: Optional[str] = None


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    idea_id: str
    doc_type: DocumentType
    status: str
    version: int
    created_at: datetime


class DocumentDetailResponse(DocumentResponse):
    content: Optional[str] = None
