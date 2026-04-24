from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ChatRequest(BaseModel):
    message: str
    document_ids: Optional[List[str]] = None  # None = search all user docs


class Source(BaseModel):
    document_name: str
    page: int
    chunk: str


class ChatResponse(BaseModel):
    id: str
    message: str
    response: str
    sources: List[Source]
    created_at: datetime
