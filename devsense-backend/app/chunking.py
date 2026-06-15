import os
import uuid

CHUNK_SIZE = 40  # lines per chunk

def chunk_file(file_path):
    chunks = []

    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
    except Exception:
        return []

    total_lines = len(lines)

    for i in range(0, total_lines, CHUNK_SIZE):
        chunk_lines = lines[i:i + CHUNK_SIZE]
        chunk_text = "".join(chunk_lines)

        chunk = {
            "id": str(uuid.uuid4()),
            "file_path": file_path,
            "start_line": i + 1,
            "end_line": min(i + CHUNK_SIZE, total_lines),
            "content": chunk_text
        }

        chunks.append(chunk)

    return chunks


def chunk_repository(file_list):
    all_chunks = []

    for file_path in file_list:
        file_chunks = chunk_file(file_path)
        all_chunks.extend(file_chunks)

    return all_chunks