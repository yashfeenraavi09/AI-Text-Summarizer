from fastapi import FastAPI
from pydantic import BaseModel
from agent import summarize_text

app = FastAPI()

class InputText(BaseModel):
    text: str

@app.post("/summarize")
def summarize(data: InputText):

    summary = summarize_text(data.text)

    return {
        "summary": summary
    }