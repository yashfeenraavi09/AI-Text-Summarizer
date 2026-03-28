from dotenv import load_dotenv
import os
from google import genai

# Load env
load_dotenv()

# Create client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def summarize_text(text, tone="Professional", length="Medium"):
    # Determine the length instruction
    if length == "Short":
        length_instruction = "in 1-2 short sentences"
    elif length == "Long":
        length_instruction = "in 4-6 detailed sentences"
    else:
        length_instruction = "in 2-3 clear sentences"
        
    prompt = f"""
    Summarize the following text {length_instruction}.
    Ensure the tone of the summary is: {tone}.
    Keep it well-structured and concise.

    Text:
    {text}
    """
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return response.text