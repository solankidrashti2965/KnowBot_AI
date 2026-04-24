import asyncio
from mongomock_motor import AsyncMongoMockClient

async def test():
    client = AsyncMongoMockClient()
    db = client.testdb
    await db.chats.insert_one({"created_at": 1, "test": "a"})
    try:
        cursor = db.chats.find({}).sort("created_at", -1)
        res = await cursor.to_list(length=10)
        print("SORT WORKED")
    except Exception as e:
        print("SORT FAILED:", type(e), str(e))

asyncio.run(test())
