import os
import json
import boto3
from dotenv import load_dotenv
from app.config import MAX_CONTEXT_CHARS

load_dotenv()

AWS_BEARER_TOKEN_BEDROCK = os.getenv("AWS_BEARER_TOKEN_BEDROCK", "")
LLM_MODEL_ID = "anthropic.claude-sonnet-4-20250514-v1:0"

bedrock_client = boto3.client(
    "bedrock-runtime",
    region_name="us-east-1"
)


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
    if not AWS_BEARER_TOKEN_BEDROCK:
        return "Error: AWS_BEARER_TOKEN_BEDROCK not configured"
    
    try:
        response = bedrock_client.invoke_model(
            modelId=LLM_MODEL_ID,
            body=json.dumps({
                "anthropic_version": "bedrock-2023-06-01",
                "max_tokens": 2000,
                "temperature": 0.2,
                "messages": [{"role": "user", "content": prompt}]
            })
        )
        result = json.loads(response["body"].read())
        return result["content"][0]["text"]
    except Exception as e:
        return f"Error calling Bedrock Claude: {str(e)}"
