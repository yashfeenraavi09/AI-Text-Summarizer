from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
from agent import summarize_text
import os

app = FastAPI()

# Enable CORS for frontend flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InputText(BaseModel):
    text: str
    tone: Optional[str] = "Professional"
    length: Optional[str] = "Medium"

@app.post("/summarize")
def summarize(data: InputText):
    summary = summarize_text(data.text, data.tone, data.length)
    return {
        "summary": summary
    }

# Ensure the frontend directory exists (so the backend doesn't crash if it doesn't)
os.makedirs("frontend", exist_ok=True)

# Serve the static files for the frontend
app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/")
def serve_frontend():
    return FileResponse("frontend/index.html")