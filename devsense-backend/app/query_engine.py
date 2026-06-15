import os
import json
import faiss
import numpy as np

from app.embeddings import generate_embedding, EMBED_DIM
from app.vector_store import _make_paths
from app.llm_service import generate_response

MAX_HISTORY = 10
MAX_CONTEXT_CHARS = 15000

chat_sessions = {}

def get_index_path(project_name: str):
    idx_path, _ = _make_paths(project_name)
    return idx_path


def get_chunks_path(project_name: str):
    _, meta_path = _make_paths(project_name)
    return meta_path


def embed_text(text: str):
    # reuse the embedding logic from embeddings module; this handles
    # USE_BEDROCK flag internally, producing mock vectors when disabled.
    emb = generate_embedding(text)
    return emb.astype("float32")


def ask_claude(session_id: str, question: str, context: str):
    if session_id not in chat_sessions:
        chat_sessions[session_id] = []

    history = chat_sessions[session_id]

    system_instruction = """You are a senior software engineer analyzing a repository.

Rules:
- Only use provided repository context.
- If context does not contain answer, say so.
- Be precise and technical."""

    user_message = f"""Repository Context:
{context}

User Question:
{question}"""

    # Build the full prompt with history
    full_prompt = system_instruction + "\n\n"
    
    # Add conversation history
    for msg in history:
        if msg["role"] == "user":
            full_prompt += f"\nUser: {msg['content']}\n"
        else:
            full_prompt += f"\nAssistant: {msg['content']}\n"
    
    # Add current question
    full_prompt += f"\nUser: {user_message}\n\nAssistant:"

    try:
        answer = generate_response(full_prompt)

        history.append({"role": "user", "content": user_message})
        history.append({"role": "assistant", "content": answer})
        chat_sessions[session_id] = history[-MAX_HISTORY:]

        return answer
    except Exception as e:
        return f"Error: {str(e)}"


def query_codebase(project_name: str, session_id: str, query: str, top_k: int = 10):

    index_path = get_index_path(project_name)
    chunks_path = get_chunks_path(project_name)

    if not os.path.exists(index_path):
        return f"Index not found for project '{project_name}'. Please ingest first."

    index = faiss.read_index(index_path)

    with open(chunks_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    query_vector = embed_text(query).reshape(1, EMBED_DIM)

    distances, indices = index.search(query_vector, top_k)

    retrieved_chunks = []
    for idx in indices[0]:
        if idx < len(chunks):
            retrieved_chunks.append(chunks[idx]["content"])

    if not retrieved_chunks:
        return "No relevant code found."

    combined_context = "\n\n".join(retrieved_chunks)
    combined_context = combined_context[:MAX_CONTEXT_CHARS]

    print("Project:", project_name)
    print("Retrieved chunks:", len(retrieved_chunks))
    print("Context length:", len(combined_context))

    answer = ask_claude(session_id, query, combined_context)

    return answer