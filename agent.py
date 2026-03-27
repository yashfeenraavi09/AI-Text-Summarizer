from dotenv import load_dotenv
import os
from google import genai

# Load env
load_dotenv()

# Create client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def summarize_text(text):
    response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=f"""
    Summarize the following text in 2-3 short, clear sentences.
    Keep it simple and concise.

    Text:
    {text}
    """
)

    return response.text