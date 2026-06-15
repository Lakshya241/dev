import re
from app.vector_store import VectorStore
from app.embeddings import generate_embedding


def extract_file_references(error_text: str):
    pattern = r'File "(.+?)", line (\d+)'
    matches = re.findall(pattern, error_text)

    extracted = []
    for file_path, line in matches:
        extracted.append({
            "file_path": file_path,
            "line": int(line)
        })

    return extracted


def search_error_context(error_text: str, top_k: int = 5):
    vector_store = VectorStore()
    vector_store.load()

    query_embedding = generate_embedding(error_text)

    results = vector_store.search(query_embedding, top_k=top_k)

    return results