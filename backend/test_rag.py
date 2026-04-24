import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from database import connect_db, get_db
from services.rag import get_rag_response

async def test():
    await connect_db()
    # Test RAG on an empty DB
    try:
        res = await get_rag_response(user_id="fake_id", message="What are the key points?")
        print("SUCCESS:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(test())
