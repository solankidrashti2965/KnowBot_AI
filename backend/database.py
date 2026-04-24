import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# MongoDB Atlas Configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "ai_knowledge_assistant")

import certifi

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_db():
    """Establish connection to MongoDB Atlas."""
    try:
        # Use certifi for SSL/TLS certificates and add timeouts
        db_instance.client = AsyncIOMotorClient(
            MONGODB_URI,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000
        )
        db_instance.db = db_instance.client[DB_NAME]
        # Ping to verify connection
        await db_instance.client.admin.command('ping')
        print(f"✅ Connected to MongoDB Atlas: {DB_NAME}")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        raise e

async def close_db():
    """Close MongoDB connection."""
    if db_instance.client:
        db_instance.client.close()
        print("MongoDB connection closed")

def get_db():
    """Return the database instance."""
    if db_instance.db is None:
        raise RuntimeError("Database not initialized. Call connect_db() first.")
    return db_instance.db
