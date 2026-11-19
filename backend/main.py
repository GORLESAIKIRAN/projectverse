import os
import sys

# Ensure current directory is on Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"[*] Starting GSK MEDIAVERSE Backend on http://{host}:{port}")
    uvicorn.run(app, host=host, port=port)
