import os
import google.generativeai as genai
from dotenv import load_dotenv
from app.config import MAX_CONTEXT_CHARS

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)


def build_prompt(query: str, retrieved_chunks: list):
    context_text = ""

    for chunk in retrieved_chunks:
        context_text += (
            f"\nFile: {chunk['file_path']} "
            f"(Lines {chunk['start_line']}-{chunk['end_line']})\n"
        )
        context_text += chunk["content"] + "\n"

    context_text = context_text[:MAX_CONTEXT_CHARS]

    return f"""
You are DevSense, an AI developer assistant.

Use ONLY the provided project context.

Project Context:
{context_text}

Question:
{query}

Provide:
- Clear explanation
- Reference file names
- Mention line numbers
- Avoid hallucination
"""


def generate_response(prompt: str):
    if not GEMINI_API_KEY:
        return "Error: GEMINI_API_KEY not configured in .env file"
    
    try:
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.2,
                "max_output_tokens": 2000,
            }
        )
        return response.text
    except Exception as e:
        return f"Error calling Gemini: {str(e)}"
