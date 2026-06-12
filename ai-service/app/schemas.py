from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    service: str
    model: str


class IngestResponse(BaseModel):
    indexedDocuments: int
    newChunks: int
    totalChunks: int
    alreadyIndexed: bool
    message: str


class SourceItem(BaseModel):
    file: str
    snippet: str


class AskRequest(BaseModel):
    question: str = Field(..., min_length=3)
    equipmentCode: Optional[str] = None


class AskResponse(BaseModel):
    answer: str
    sources: List[SourceItem]


class DiagnosisRequest(BaseModel):
    equipmentCode: str = Field(..., min_length=2)
    breakdownDescription: str = Field(..., min_length=3)


class DiagnosisResponse(BaseModel):
    diagnosis: str
    recommendedActions: List[str]
    sources: List[SourceItem]


class EquipmentDocumentGenerateRequest(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    serialNumber: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    criticality: Optional[str] = None
    description: Optional[str] = None


class EquipmentDocumentGenerateResponse(BaseModel):
    title: str
    content: str
