from pydantic import BaseModel
from datetime import datetime


class DocumentResponse(BaseModel):
    id: str
    user_id: str
    filename: str
    original_name: str
    file_size: int
    page_count: int
    chunk_count: int
    status: str  # processing | ready | error
    created_at: datetime
