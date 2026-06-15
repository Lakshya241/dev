import os
import json
import numpy as np
import boto3
from dotenv import load_dotenv

# load default .env then also try s.env (workspace contains s.env currently)
load_dotenv()
load_dotenv('s.env', override=False)

USE_BEDROCK = os.getenv("USE_BEDROCK", "false").lower() == "true"

REGION = "us-east-1"
EMBED_MODEL_ID = "amazon.titan-embed-text-v1"  # Titan returns 1536 dimensions
EMBED_DIM = 1536  # Titan embedding dimension

if USE_BEDROCK:
    bedrock = boto3.client("bedrock-runtime", region_name=REGION)


def generate_embedding(text: str, dim: int = EMBED_DIM):
    if USE_BEDROCK:
        body = json.dumps({
            "inputText": text
        })

        response = bedrock.invoke_model(
            modelId=EMBED_MODEL_ID,
            body=body,
            contentType="application/json",
            accept="application/json"
        )

        response_body = json.loads(response["body"].read())
        embedding = response_body.get("embedding", response_body.get("embeddings", []))
        return np.array(embedding).astype("float32")

    # fallback mock embedding
    np.random.seed(abs(hash(text)) % (10**8))
    return np.random.rand(dim).astype("float32")