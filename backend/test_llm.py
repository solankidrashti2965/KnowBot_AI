import os
import asyncio
from services.llm import generate_response
from dotenv import load_dotenv

load_dotenv()

async def test():
    try:
        resp = await generate_response("Say the word 'Hello'")
        print("SUCCESS:", resp)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(test())
