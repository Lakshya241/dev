"""
LLM Service using direct Anthropic API (fallback when Bedrock not available)
"""
import os
import json
import requests
from dotenv import load_dotenv
from app.config import MAX_CONTEXT_CHARS

load_dotenv()

USE_ANTHROPIC_DIRECT = os.getenv("USE_ANTHROPIC_DIRECT", "false").lower() == "true"
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

def build_prompt(query: str, retrieved_chunks: list):
    context_text = ""

    for chunk in retrieved_chunks:
        context_text += (
            f"\nFile: {chunk['file_path']} "
            f"(Lines {chunk['start_line']}-{chunk['end_line']})\n"
        )
        context_text += chunk["content"] + "\n"

    # Hard cap context size
    context_text = context_text[:MAX_CONTEXT_CHARS]

    return f"""You are DevSense, an AI developer assistant.

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


def generate_response_anthropic(prompt: str):
    """Generate response using direct Anthropic API"""
    if not ANTHROPIC_API_KEY:
        return "Anthropic API key not configured."
    
    try:
        headers = {
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        data = {
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 2000,
            "temperature": 0.2,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
        
        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json=data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            return result["content"][0]["text"]
        else:
            return f"Anthropic API error: {response.status_code} - {response.text}"
            
    except Exception as e:
        return f"Error calling Anthropic API: {str(e)}"


def generate_response(prompt: str):
    """Main function that tries Anthropic direct API first, then falls back"""
    if USE_ANTHROPIC_DIRECT and ANTHROPIC_API_KEY:
        return generate_response_anthropic(prompt)
    
    # Fallback to mock
    return "AI response unavailable. Please configure Anthropic API key or wait for Bedrock approval."
