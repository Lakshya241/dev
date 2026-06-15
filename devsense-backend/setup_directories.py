"""
Setup script to create all necessary directories for DevSense backend
"""
from pathlib import Path

def setup_directories():
    """Create all required directories"""
    directories = [
        "data/repos",
        "data/indexes",
        "data/metadata",
        "data/feedback",
        "data/logs"
    ]
    
    for dir_path in directories:
        path = Path(dir_path)
        path.mkdir(parents=True, exist_ok=True)
        print(f"✓ Created/verified: {dir_path}")
    
    print("\n✅ All directories are ready!")

if __name__ == "__main__":
    setup_directories()
