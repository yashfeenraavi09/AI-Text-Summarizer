import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load env
load_dotenv()

# Configure API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# List models
models = genai.list_models()

for model in models:
    print(model.name, " | ", model.supported_generation_methods)