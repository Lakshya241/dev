"""
FREE LLM Service using Hugging Face Inference API
No AWS costs, works globally, free tier: 32,000 requests/month
"""
import os
import requests
from dotenv import load_dotenv
from app.config import MAX_CONTEXT_CHARS

load_dotenv()

# Get your free API token from https://huggingface.co/settings/tokens
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")
HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1"

USE_HF = os.getenv("USE_HF", "false").lower() == "true"


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


def generate_response(prompt: str):
    """Generate response using FREE Hugging Face API"""
    
    if not USE_HF:
        return "Mock response (Hugging Face disabled). Set USE_HF=true"
    
    if not HF_API_TOKEN:
        return "⚠️ ERROR: HF_API_TOKEN not set. Get free token from https://huggingface.co/settings/tokens"
    
    try:
        headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_length": 2000,
                "temperature": 0.2,
            }
        }
        
        response = requests.post(HF_API_URL, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            
            # Handle different response formats
            if isinstance(result, list) and len(result) > 0:
                if "generated_text" in result[0]:
                    return result[0]["generated_text"]
            
            return str(result)
        
        elif response.status_code == 429:
            return "⚠️ Rate limited. Hugging Face free tier: 32,000 requests/month. Upgrade at https://huggingface.co"
        
        else:
            error_msg = response.json().get("error", response.text)
            return f"⚠️ Hugging Face API Error: {error_msg}"
    
    except requests.exceptions.Timeout:
        return "⚠️ Request timeout. Hugging Face API might be slow. Try again."
    except Exception as e:
        return f"⚠️ Error: {str(e)}"
