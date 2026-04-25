import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
uri = os.getenv("MONGODB_URI")
if not uri:
    print("URI NOT FOUND")
else:
    # Check for whitespace
    print(f"URI start: '{uri[:10]}...'")
    print(f"URI end: '...{uri[-10:]}'")
    print(f"Total length: {len(uri)}")
    if uri.strip() != uri:
        print("⚠️ WARNING: Trailing or leading whitespace detected!")
    
    # Try to extract password
    try:
        parts = uri.split(":")
        if len(parts) > 2:
            pass_part = parts[2].split("@")[0]
            print(f"Password starts with: {pass_part[0]} and ends with: {pass_part[-1]}")
            print(f"Password length: {len(pass_part)}")
    except:
        print("Could not parse password")
