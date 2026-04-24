import os
import json
import asyncio
import re
from bson import ObjectId
from datetime import datetime

# Path to our local permanent storage
DB_FILE = os.path.join(os.path.dirname(__file__), "knowbase_db.json")

def date_hook(json_dict):
    """Automatically convert ISO date strings back to datetime objects."""
    for key, value in json_dict.items():
        if isinstance(value, str) and re.match(r'\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}', value):
            try:
                # Handle space or T separator, and potential trailing Z or offsets
                clean_val = value.replace(' ', 'T').replace('Z', '+00:00')
                json_dict[key] = datetime.fromisoformat(clean_val)
            except: pass
    return json_dict

class Collection:
    def __init__(self, name, parent_db):
        self.name = name
        self.parent_db = parent_db

    def _get_data(self):
        return self.parent_db.data.get(self.name, [])

    async def insert_one(self, document):
        doc = document.copy()
        if "_id" not in doc:
            doc["_id"] = str(ObjectId())
        self.parent_db.data.setdefault(self.name, []).append(doc)
        self.parent_db.save()
        
        class InsertResult:
            def __init__(self, id): self.inserted_id = id
        return InsertResult(doc["_id"])

    async def find_one(self, query):
        cursor = self.find(query)
        res = await cursor.to_list()
        return res[0] if res else None

    def find(self, query):
        data = self._get_data()
        results = []
        for doc in data:
            match = True
            for k, v in query.items():
                val = doc.get(k)
                if k == "_id":
                    if isinstance(v, ObjectId): v = str(v)
                    if isinstance(val, ObjectId): val = str(val)
                
                if isinstance(v, dict):
                    # Operator Support
                    if "$in" in v:
                        if val not in v["$in"]: match = False; break
                    elif "$ne" in v:
                        if val == v["$ne"]: match = False; break
                    elif "$gte" in v:
                        if val is None or val < v["$gte"]: match = False; break
                elif val != v:
                    match = False
                    break
            if match: results.append(doc)
        
        class Cursor:
            def __init__(self, r): self.r = r
            def sort(self, key_name, direction=-1):
                def sort_key(x):
                    v = x.get(key_name)
                    if v is None: return datetime.min
                    return v
                self.r.sort(key=sort_key, reverse=(direction == -1))
                return self
            def limit(self, l): self.r = self.r[:l]; return self
            def skip(self, s): self.r = self.r[s:]; return self
            async def to_list(self, length=None):
                if length is not None: return self.r[:length]
                return self.r
        return Cursor(results)

    async def count_documents(self, query):
        cursor = self.find(query)
        res = await cursor.to_list()
        return len(res)

    async def update_one(self, query, update):
        doc = await self.find_one(query)
        if doc:
            if "$set" in update:
                doc.update(update["$set"])
            if "$inc" in update:
                for k, v in update["$inc"].items():
                    doc[k] = doc.get(k, 0) + v
            self.parent_db.save()
            return True
        return False

    async def delete_one(self, query):
        data = self._get_data()
        for i, doc in enumerate(data):
            match = True
            for k, v in query.items():
                if doc.get(k) != v: match = False; break
            if match:
                data.pop(i)
                self.parent_db.save()
                return True
        return False

    async def delete_many(self, query):
        data = self._get_data()
        initial_len = len(data)
        self.parent_db.data[self.name] = [d for d in data if not all(d.get(k) == v for k, v in query.items())]
        self.parent_db.save()
        return type('obj', (object,), {'deleted_count': initial_len - len(self.parent_db.data[self.name])})

    async def create_index(self, *args, **kwargs): pass

class PersistentDB:
    def __init__(self):
        self.data = {}
        self.load()
        self.users = Collection("users", self)
        self.documents = Collection("documents", self)
        self.chats = Collection("chats", self)

    def load(self):
        if os.path.exists(DB_FILE):
            try:
                with open(DB_FILE, "r") as f:
                    self.data = json.load(f, object_hook=date_hook)
            except: self.data = {}

    def save(self):
        def serializer(obj):
            if isinstance(obj, (datetime, ObjectId)):
                return obj.isoformat() if hasattr(obj, 'isoformat') else str(obj)
            return str(obj)
        
        with open(DB_FILE, "w") as f:
            json.dump(self.data, f, default=serializer, indent=2)

db = PersistentDB()

async def connect_db():
    print(f"Connected to Persistent Local DB ({DB_FILE})")

async def close_db():
    db.save()

def get_db():
    return db
