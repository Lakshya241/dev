import faiss
import numpy as np
import os
import json

BASE_INDEX_DIR = "data/indexes"
BASE_METADATA_DIR = "data/metadata"
EMBED_DIM = 1536  # Titan embedding dimension


def _make_paths(project_name: str):
    name = project_name or "default"
    index_path = os.path.join(BASE_INDEX_DIR, f"{name}.index")
    metadata_path = os.path.join(BASE_METADATA_DIR, f"{name}.json")
    return index_path, metadata_path


class VectorStore:
    def __init__(self, project_name: str = None):
        self.project_name = project_name or "default"
        self.index = faiss.IndexFlatL2(EMBED_DIM)
        self.metadata = []

    # ----------------------------
    # ADD EMBEDDINGS
    # ----------------------------
    def add_embeddings(self, embeddings, chunks):

        if not embeddings:
            raise ValueError("No embeddings provided.")

        vectors = np.array(embeddings).astype("float32")

        if vectors.ndim == 1:
            vectors = np.expand_dims(vectors, 0)

        if vectors.shape[1] != EMBED_DIM:
            raise ValueError(
                f"Embedding dimension {vectors.shape[1]} "
                f"does not match expected {EMBED_DIM}"
            )

        # reset to prevent stacking old vectors
        self.index.reset()
        self.metadata = []

        self.index.add(vectors)
        self.metadata.extend(chunks)

    # ----------------------------
    # SAVE
    # ----------------------------
    def save(self):
        os.makedirs(BASE_INDEX_DIR, exist_ok=True)
        os.makedirs(BASE_METADATA_DIR, exist_ok=True)

        idx_path, meta_path = _make_paths(self.project_name)

        faiss.write_index(self.index, idx_path)

        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(self.metadata, f)

    # ----------------------------
    # LOAD
    # ----------------------------
    def load(self):
        idx_path, meta_path = _make_paths(self.project_name)

        if os.path.exists(idx_path):
            self.index = faiss.read_index(idx_path)

        if os.path.exists(meta_path):
            with open(meta_path, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)

    # ----------------------------
    # SEARCH
    # ----------------------------
    def search(self, query_embedding, top_k=4):

        if self.index.ntotal == 0:
            return []

        query_vector = np.array([query_embedding]).astype("float32")

        if query_vector.shape[1] != self.index.d:
            raise ValueError(
                f"Query embedding dimension {query_vector.shape[1]} "
                f"does not match index dimension {self.index.d}"
            )

        try:
            distances, indices = self.index.search(query_vector, top_k)
        except Exception as exc:
            raise RuntimeError(f"FAISS search failed: {exc}")

        results = []
        for idx in indices[0]:
            if 0 <= idx < len(self.metadata):
                results.append(self.metadata[idx])

        return results