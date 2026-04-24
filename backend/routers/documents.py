from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from models.document import DocumentResponse
from database import get_db
from routers.auth import get_current_user
from services.document_parser import extract_text_from_file
from services.vectorstore import add_documents_to_index, remove_document_from_index
from datetime import datetime
from bson import ObjectId
import aiofiles
import os

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
MAX_FILE_SIZE_FREE = 10 * 1024 * 1024   # 10 MB
MAX_FILE_SIZE_PRO = 50 * 1024 * 1024    # 50 MB
MAX_DOCS_FREE = 5


@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    db = get_db()
    user_id = str(current_user["_id"])
    plan = current_user.get("plan", "free")

    # Validate file type
    allowed_extensions = {".pdf", ".docx", ".doc", ".pptx", ".ppt", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported format. Supported: PDF, Word, PPT, TXT, Images"
        )

    # Check plan limits
    if plan == "free":
        doc_count = await db.documents.count_documents(
            {"user_id": user_id, "status": {"$ne": "error"}}
        )
        if doc_count >= MAX_DOCS_FREE:
            raise HTTPException(
                status_code=403,
                detail=f"Free plan is limited to {MAX_DOCS_FREE} documents. Upgrade to Pro for unlimited uploads!",
            )

    # Read and check file size
    contents = await file.read()
    max_size = MAX_FILE_SIZE_PRO if plan == "pro" else MAX_FILE_SIZE_FREE
    if len(contents) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large (max {max_size // (1024*1024)}MB on {plan} plan)",
        )

    # Save file to disk
    user_dir = os.path.join(UPLOAD_DIR, user_id)
    os.makedirs(user_dir, exist_ok=True)
    safe_filename = f"{ObjectId()}_{file.filename}"
    file_path = os.path.join(user_dir, safe_filename)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(contents)

    # Create MongoDB record
    doc = {
        "user_id": user_id,
        "filename": safe_filename,
        "original_name": file.filename,
        "file_size": len(contents),
        "file_path": file_path,
        "page_count": 0,
        "chunk_count": 0,
        "status": "processing",
        "created_at": datetime.utcnow(),
    }

    result = await db.documents.insert_one(doc)
    doc_id = str(result.inserted_id)

    await db.users.update_one({"_id": current_user["_id"]}, {"$inc": {"total_docs": 1}})

    # Process document in background (parse + embed)
    background_tasks.add_task(process_document, doc_id, file_path, user_id)

    return {
        "id": doc_id,
        "status": "processing",
        "message": "Document uploaded! Processing in background…",
    }


async def process_document(doc_id: str, file_path: str, user_id: str):
    """Background task: parse document → embed chunks → update status."""
    db = get_db()
    try:
        chunks, page_count = extract_text_from_file(file_path)
        await add_documents_to_index(user_id, doc_id, chunks)
        await db.documents.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {"status": "ready", "page_count": page_count, "chunk_count": len(chunks)}},
        )
    except Exception as e:
        await db.documents.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {"status": "error", "error_message": str(e)}},
        )


@router.get("/", response_model=list[DocumentResponse])
async def list_documents(current_user=Depends(get_current_user)):
    db = get_db()
    user_id = str(current_user["_id"])

    cursor = db.documents.find({"user_id": user_id}).sort("created_at", -1)
    docs = await cursor.to_list(length=100)

    return [
        DocumentResponse(
            id=str(d["_id"]),
            user_id=d["user_id"],
            filename=d["filename"],
            original_name=d["original_name"],
            file_size=d["file_size"],
            page_count=d.get("page_count", 0),
            chunk_count=d.get("chunk_count", 0),
            status=d["status"],
            created_at=d["created_at"],
        )
        for d in docs
    ]


@router.delete("/{doc_id}")
async def delete_document(doc_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    user_id = str(current_user["_id"])

    doc = await db.documents.find_one({"_id": ObjectId(doc_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove file from disk
    if os.path.exists(doc.get("file_path", "")):
        os.remove(doc["file_path"])

    # Remove from FAISS index
    await remove_document_from_index(user_id, doc_id)

    # Remove from DB
    await db.documents.delete_one({"_id": ObjectId(doc_id)})
    await db.users.update_one({"_id": current_user["_id"]}, {"$inc": {"total_docs": -1}})

    return {"message": "Document deleted successfully"}


@router.get("/{doc_id}/status")
async def get_document_status(doc_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    user_id = str(current_user["_id"])
    doc = await db.documents.find_one({"_id": ObjectId(doc_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": doc["status"], "chunk_count": doc.get("chunk_count", 0)}
