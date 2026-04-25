import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import certifi

load_dotenv("backend/.env")

async def test_conn():
    uri = os.getenv("MONGODB_URI")
    print(f"Testing URI: {uri[:20]}...")
    try:
        client = AsyncIOMotorClient(uri, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')
        print("✅ SUCCESS")
    except Exception as e:
        print(f"❌ FAILED: {e}")

asyncio.run(test_conn())
