import os
from dotenv import load_dotenv

load_dotenv()

# Determine which LLM provider to use
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()

# Import the appropriate service based on provider
if LLM_PROVIDER == "gemini":
    from app.llm_service_gemini import build_prompt, generate_response
elif LLM_PROVIDER == "anthropic":
    from app.llm_service_anthropic import build_prompt, generate_response
elif LLM_PROVIDER == "openai":
    from app.llm_service_openai import build_prompt, generate_response
elif LLM_PROVIDER == "bedrock":
    from app.llm_service_bedrock import build_prompt, generate_response
else:
    # Default to Gemini
    from app.llm_service_gemini import build_prompt, generate_response

# Re-export for backward compatibility
__all__ = ['build_prompt', 'generate_response']