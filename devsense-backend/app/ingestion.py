import os
import json
import subprocess
import shutil
import faiss
import numpy as np
import time
import tempfile
from pathlib import Path
from app.query_engine import embed_text

# ====== HARD LIMITS ======
MAX_FILE_SIZE_KB = 500
MAX_TOTAL_CHUNKS = 10000
CHUNK_SIZE = 500
CHUNK_OVERLAP = 100
ALLOWED_EXTENSIONS = [".py", ".js", ".ts", ".tsx", ".java", ".md", ".json", ".jsx", ".go", ".rb", ".php", ".c", ".cpp", ".h", ".cs", ".swift", ".kt", ".rs"]

BASE_REPO_PATH = "data/repos"


def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks


def ingest_repository(repo_url: str, project_name: str):
    # Use Path for cross-platform compatibility
    project_path = Path(BASE_REPO_PATH) / project_name
    
    # Clone repo - use cross-platform directory removal with retry
    if project_path.exists():
        try:
            # On Windows, sometimes files are locked, so we need to be more aggressive
            for attempt in range(3):
                try:
                    shutil.rmtree(project_path, ignore_errors=False)
                    break
                except Exception as e:
                    if attempt < 2:
                        time.sleep(1)  # Wait and retry
                    else:
                        # Last resort: use ignore_errors
                        shutil.rmtree(project_path, ignore_errors=True)
            
            # Wait to ensure cleanup is complete
            time.sleep(0.5)
        except Exception as e:
            print(f"Warning: Could not fully remove old directory: {e}")
    
    # Ensure parent directory exists
    project_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Clone to a temporary directory first (outside OneDrive) to avoid sync issues
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_clone_path = Path(temp_dir) / project_name
        
        try:
            print(f"Cloning to temporary directory: {temp_clone_path}")
            # Clone to temp directory
            result = subprocess.run(
                ["git", "clone", "--depth", "1", repo_url, str(temp_clone_path)],
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode != 0 and "Clone succeeded" not in result.stderr:
                raise Exception(f"Git clone failed: {result.stderr}")
            
            print("Clone completed, moving to final location...")
            
            # Now copy from temp to final location (this avoids git checkout issues)
            shutil.copytree(temp_clone_path, project_path, dirs_exist_ok=True, ignore=shutil.ignore_patterns('.git'))
            
            print(f"Repository copied to: {project_path}")
                
        except subprocess.TimeoutExpired:
            raise Exception("Repository clone timed out (>5 minutes)")
        except Exception as e:
            raise Exception(f"Failed to clone repository: {str(e)}")

    all_chunks = []
    embeddings = []

    # Walk through the cloned repository
    for root, dirs, files in os.walk(project_path):
        # Skip heavy folders and .git
        dirs[:] = [d for d in dirs if d not in ["node_modules", ".git", "build", "dist", "__pycache__", "venv", ".venv"]]

        for file in files:
            file_path = Path(root) / file

            # Check file extension
            if not any(file.endswith(ext) for ext in ALLOWED_EXTENSIONS):
                continue

            # Check file size
            try:
                file_size_kb = file_path.stat().st_size / 1024
                if file_size_kb > MAX_FILE_SIZE_KB:
                    continue
            except:
                continue

            # Read and process file
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()

                chunks = chunk_text(content)

                for chunk in chunks:
                    if len(all_chunks) >= MAX_TOTAL_CHUNKS:
                        print(f"Chunk limit ({MAX_TOTAL_CHUNKS}) reached. Stopping ingestion.")
                        break

                    embedding = embed_text(chunk)
                    embeddings.append(embedding)
                    all_chunks.append({
                        "file": str(file_path),
                        "content": chunk
                    })

            except Exception as e:
                print(f"Error processing {file_path}: {e}")
                continue

        if len(all_chunks) >= MAX_TOTAL_CHUNKS:
            break

    if not embeddings:
        return {"message": "No valid files found.", "chunk_count": 0}

    # Convert to numpy array
    embedding_matrix = np.vstack(embeddings).astype("float32")

    dimension = embedding_matrix.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embedding_matrix)

    # Save per-project index
    indexes_dir = Path("data/indexes")
    metadata_dir = Path("data/metadata")
    indexes_dir.mkdir(parents=True, exist_ok=True)
    metadata_dir.mkdir(parents=True, exist_ok=True)

    index_path = indexes_dir / f"{project_name}.index"
    chunks_path = metadata_dir / f"{project_name}.json"

    faiss.write_index(index, str(index_path))

    with open(chunks_path, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f)

    return {
        "message": "Ingested successfully",
        "chunk_count": len(all_chunks)
    }