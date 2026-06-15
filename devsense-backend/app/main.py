from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
from app.ingestion import ingest_repository
from app.query_engine import query_codebase
from app.llm_service import build_prompt, generate_response
from app.cache import get_cached, set_cache
from app.dependency_analyzer import load_dependency_map, calculate_impact_score
from app.vector_store import VectorStore

app = FastAPI(title="DevSense AI Backend")

# allow frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://*.vercel.app",
        "https://*.onrender.com",
        "*"  # Allow all for now, remove in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RepoRequest(BaseModel):
    repo_url: str
    project_name: str


class QueryRequest(BaseModel):
    project_name: str
    session_id: str
    query: str


class ImpactRequest(BaseModel):
    file_path: str


class FeedbackRequest(BaseModel):
    project_name: str
    rating: int
    feedback_text: str
    category: str


@app.get("/")
def health_check():
    return {"status": "DevSense backend running"}


@app.post("/ingest")
def ingest_repo(request: RepoRequest):
    try:
        log_activity(request.project_name, "ingestion_started", {"repo_url": request.repo_url})
        result = ingest_repository(request.repo_url, request.project_name)
        log_activity(request.project_name, "ingestion_completed", result)
        return {"message": "Repository ingested successfully", **result}
    except subprocess.TimeoutExpired:
        log_activity(request.project_name, "ingestion_failed", {"error": "timeout"})
        raise HTTPException(status_code=504, detail="Repository clone timed out. The repository might be too large.")
    except Exception as exc:
        # Log the full error for debugging
        import traceback
        print(f"Ingestion error: {traceback.format_exc()}")
        log_activity(request.project_name, "ingestion_failed", {"error": str(exc)})
        # Give user helpful feedback
        error_msg = str(exc)
        if "git" in error_msg.lower():
            error_msg = f"Git error: {error_msg}. Make sure the repository URL is correct and accessible."
        raise HTTPException(status_code=500, detail=error_msg)


@app.post("/query")
def query_endpoint(request: QueryRequest):
    log_activity(request.project_name, "query_submitted", {"query": request.query[:100]})
    response = query_codebase(
        project_name=request.project_name,
        session_id=request.session_id,
        query=request.query
    )
    log_activity(request.project_name, "query_completed", {"query": request.query[:100]})
    return {"response": response}



@app.post("/impact-analysis")
def impact_analysis(request: ImpactRequest):
    graph = load_dependency_map()
    direct, indirect, score, risk = calculate_impact_score(
        request.file_path, graph
    )

    return {
        "target_file": request.file_path,
        "direct_dependencies": direct,
        "indirect_dependencies": indirect,
        "impact_score": score,
        "risk_level": risk
    }


@app.get("/generate-architecture")
def generate_architecture(project_name: str = "default"):
    vector_store = VectorStore(project_name)
    vector_store.load()

    if vector_store.index.ntotal == 0:
        return {"message": f"No project indexed for '{project_name}'."}

    sample_chunks = vector_store.metadata[:10]

    prompt = f"""
Generate a high-level architecture overview of this project ({project_name}):

{sample_chunks}
"""

    response = generate_response(prompt)

    return {"architecture_overview": response}


@app.get("/dependencies")
def get_dependencies(project_name: str = "default"):
    """Extract dependencies from the ingested project"""
    import os
    import json
    from pathlib import Path
    
    repo_path = Path(f"data/repos/{project_name}")
    
    if not repo_path.exists():
        return {
            "total": 0,
            "direct": 0,
            "transitive": 0,
            "packages": [],
            "dev_packages": [],
            "message": f"Project '{project_name}' not found. Please ingest a project first."
        }
    
    dependencies = {
        "total": 0,
        "direct": 0,
        "transitive": 0,
        "packages": [],
        "dev_packages": []
    }
    
    # Check for package.json (Node.js)
    package_json = repo_path / "package.json"
    if package_json.exists():
        try:
            with open(package_json, 'r', encoding='utf-8') as f:
                data = json.load(f)
                deps = data.get("dependencies", {})
                dev_deps = data.get("devDependencies", {})
                
                dependencies["packages"] = [{"name": k, "version": v, "type": "production"} for k, v in deps.items()]
                dependencies["dev_packages"] = [{"name": k, "version": v, "type": "development"} for k, v in dev_deps.items()]
                dependencies["direct"] = len(deps)
                dependencies["total"] = len(deps) + len(dev_deps)
                dependencies["transitive"] = dependencies["total"] * 4  # Estimate
        except Exception as e:
            print(f"Error reading package.json: {e}")
    
    # Check for requirements.txt (Python)
    requirements_txt = repo_path / "requirements.txt"
    if requirements_txt.exists():
        try:
            with open(requirements_txt, 'r', encoding='utf-8') as f:
                lines = [line.strip() for line in f if line.strip() and not line.startswith('#')]
                dependencies["packages"] = [{"name": line.split('==')[0].split('>=')[0].split('<=')[0], "version": "latest", "type": "production"} for line in lines]
                dependencies["direct"] = len(lines)
                dependencies["total"] = len(lines)
                dependencies["transitive"] = dependencies["total"] * 3  # Estimate
        except Exception as e:
            print(f"Error reading requirements.txt: {e}")
    
    return dependencies


@app.get("/file-tree")
def get_file_tree(project_name: str = "default"):
    """Get the file tree structure of the ingested project"""
    from pathlib import Path
    import os
    
    repo_path = Path(f"data/repos/{project_name}")
    
    if not repo_path.exists():
        return {"tree": [], "message": f"Project '{project_name}' not found. Please ingest a project first."}
    
    def build_tree(path, depth=0, max_depth=3):
        if depth > max_depth:
            return []
        
        items = []
        try:
            # Skip hidden folders and common ignore patterns
            ignore_patterns = {'.git', '__pycache__', 'node_modules', '.venv', 'venv', 'dist', 'build', '.next'}
            
            for item in sorted(path.iterdir()):
                if item.name.startswith('.') and item.name != '.gitignore':
                    continue
                if item.name in ignore_patterns:
                    continue
                    
                if item.is_dir():
                    items.append({
                        "name": item.name + "/",
                        "type": "folder",
                        "depth": depth,
                        "path": str(item.relative_to(repo_path))
                    })
                    # Recursively add children
                    items.extend(build_tree(item, depth + 1, max_depth))
                else:
                    items.append({
                        "name": item.name,
                        "type": "file",
                        "depth": depth,
                        "path": str(item.relative_to(repo_path))
                    })
        except PermissionError:
            pass
        except Exception as e:
            print(f"Error building tree: {e}")
        
        return items
    
    tree = build_tree(repo_path)
    return {"tree": tree}


@app.post("/feedback")
def submit_feedback(request: FeedbackRequest):
    """Store user feedback"""
    import json
    from pathlib import Path
    from datetime import datetime
    
    feedback_dir = Path("data/feedback")
    
    # Ensure directory exists
    try:
        feedback_dir.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        print(f"Error creating feedback directory: {e}")
        raise HTTPException(status_code=500, detail="Unable to save feedback")
    
    feedback_file = feedback_dir / f"{request.project_name}_feedback.jsonl"
    
    feedback_entry = {
        "timestamp": datetime.now().isoformat(),
        "project_name": request.project_name,
        "rating": request.rating,
        "feedback_text": request.feedback_text,
        "category": request.category
    }
    
    try:
        with open(feedback_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(feedback_entry) + '\n')
    except Exception as e:
        print(f"Error writing feedback: {e}")
        raise HTTPException(status_code=500, detail="Unable to save feedback")
    
    return {"message": "Feedback submitted successfully", "feedback_id": feedback_entry["timestamp"]}


@app.get("/settings")
def get_settings():
    """Get current backend settings"""
    from app.config import USE_BEDROCK, MAX_CHUNKS, MAX_FILE_SIZE_KB
    
    return {
        "use_bedrock": USE_BEDROCK,
        "max_chunks": MAX_CHUNKS,
        "max_file_size_kb": MAX_FILE_SIZE_KB,
        "backend_version": "1.0.0",
        "status": "connected"
    }


@app.get("/logs")
def get_logs(project_name: str = "default", limit: int = 100):
    """Get recent activity logs"""
    import json
    from pathlib import Path
    from datetime import datetime
    
    logs_dir = Path("data/logs")
    
    # Ensure directory exists
    try:
        logs_dir.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        print(f"Error creating logs directory: {e}")
        return {"logs": [], "message": "Unable to access logs directory"}
    
    log_file = logs_dir / f"{project_name}_logs.jsonl"
    
    if not log_file.exists():
        return {"logs": [], "message": "No logs found"}
    
    logs = []
    try:
        with open(log_file, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    logs.append(json.loads(line))
        
        # Return most recent logs first
        logs = logs[-limit:][::-1]
    except Exception as e:
        print(f"Error reading logs: {e}")
        return {"logs": [], "error": str(e)}
    
    return {"logs": logs, "total": len(logs)}


def log_activity(project_name: str, action: str, details: dict = None):
    """Helper function to log activities"""
    import json
    from pathlib import Path
    from datetime import datetime
    
    logs_dir = Path("data/logs")
    
    # Ensure directory exists
    try:
        logs_dir.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        print(f"Error creating logs directory: {e}")
        return
    
    log_file = logs_dir / f"{project_name}_logs.jsonl"
    
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "action": action,
        "details": details or {}
    }
    
    try:
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry) + '\n')
    except Exception as e:
        print(f"Error writing log: {e}")
