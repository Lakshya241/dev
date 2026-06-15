"""
LLM Service using OpenAI API (alternative to Bedrock)
"""
import os
import json
from dotenv import load_dotenv
from app.config import MAX_CONTEXT_CHARS

load_dotenv()

USE_OPENAI = os.getenv("USE_OPENAI", "false").lower() == "true"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

def build_prompt(query: str, retrieved_chunks: list):
    context_text = ""

    for chunk in retrieved_chunks:
        context_text += f"\n{chunk.get('content', '')}\n"

    # Hard cap context size
    context_text = context_text[:MAX_CONTEXT_CHARS]

    return f"""You are DevSense, an AI developer assistant analyzing a code repository.

Use ONLY the provided project context to answer questions.

Project Context:
{context_text}

Question:
{query}

Provide a clear, technical explanation. Reference specific code when relevant. If the context doesn't contain enough information, say so.

Answer:"""


def generate_response(prompt: str):
    """Generate response using OpenAI API"""
    if not USE_OPENAI:
        return "OpenAI not enabled. Set USE_OPENAI=true in .env"
    
    if not OPENAI_API_KEY:
        return "OpenAI API key not configured. Add OPENAI_API_KEY to .env"
    
    try:
        # Try to import openai
        try:
            from openai import OpenAI
        except ImportError:
            return "OpenAI library not installed. Run: pip install openai"
        
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Fast and cheap, or use "gpt-4o" for better quality
            messages=[
                {
                    "role": "system",
                    "content": "You are DevSense, an AI developer assistant. Provide clear, technical explanations based on the code context provided."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=2000,
            temperature=0.2
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        return f"OpenAI API error: {str(e)}"
