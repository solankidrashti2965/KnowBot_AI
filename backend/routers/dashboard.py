from fastapi import APIRouter, Depends
from database import get_db
from routers.auth import get_current_user
from datetime import datetime, timedelta
from collections import defaultdict

router = APIRouter()


@router.get("/stats")
async def get_stats(current_user=Depends(get_current_user)):
    db = get_db()
    user_id = str(current_user["_id"])
    plan = current_user.get("plan", "free")

    # Document stats
    total_docs = await db.documents.count_documents({"user_id": user_id, "status": "ready"})
    processing_docs = await db.documents.count_documents({"user_id": user_id, "status": "processing"})

    # Chat stats
    total_chats = await db.chats.count_documents({"user_id": user_id})
    queries_today = current_user.get("queries_today", 0)

    # Storage used (bytes)
    docs = await db.documents.find({"user_id": user_id}).to_list(length=1000)
    storage_used = sum(d.get("file_size", 0) for d in docs)

    # Query activity — last 7 days chart data
    seven_days_ago = datetime.utcnow() - timedelta(days=6)
    recent_chats = await db.chats.find(
        {"user_id": user_id, "created_at": {"$gte": seven_days_ago}}
    ).to_list(length=5000)

    daily_counts: dict = defaultdict(int)
    for c in recent_chats:
        day = c["created_at"].strftime("%b %d")
        daily_counts[day] += 1

    chart_data = []
    for i in range(6, -1, -1):
        day_dt = datetime.utcnow() - timedelta(days=i)
        label = day_dt.strftime("%b %d")
        chart_data.append({"date": label, "queries": daily_counts.get(label, 0)})

    # Recent docs
    recent_docs = [
        {
            "name": d.get("original_name", ""),
            "size": d.get("file_size", 0),
            "status": d.get("status", ""),
            "pages": d.get("page_count", 0),
        }
        for d in sorted(docs, key=lambda x: x.get("created_at", datetime.min), reverse=True)[:5]
    ]

    return {
        "total_docs": total_docs,
        "processing_docs": processing_docs,
        "total_chats": total_chats,
        "queries_today": queries_today,
        "queries_limit": 20 if plan == "free" else -1,
        "storage_used": storage_used,
        "plan": plan,
        "member_since": current_user.get("created_at", datetime.utcnow()).strftime("%B %Y"),
        "chart_data": chart_data,
        "recent_docs": recent_docs,
    }
