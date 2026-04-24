import asyncio
from database import connect_db, get_db
from models.user import UserCreate
from routers.auth import signup

async def test():
    await connect_db()
    user_data = UserCreate(name="test", email="test@test.com", password="password")
    try:
        await signup(user_data)
        print("SUCCESS")
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(test())
