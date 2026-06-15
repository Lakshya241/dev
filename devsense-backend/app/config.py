import os
from dotenv import load_dotenv

load_dotenv()

# Load from environment or use defaults
USE_BEDROCK = os.getenv("USE_BEDROCK", "false").lower() == "true"
MAX_FILES = int(os.getenv("MAX_FILES", "10000"))
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "500000"))
MAX_CHUNKS = int(os.getenv("MAX_CHUNKS", "10000"))
MAX_FILE_SIZE_KB = MAX_FILE_SIZE // 1000  # Convert to KB for display
MAX_CONTEXT_CHARS = 15000
TOP_K_DEFAULT = 10
