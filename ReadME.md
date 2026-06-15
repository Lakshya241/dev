# DevSense - AI-Powered Code Assistant

DevSense is an intelligent developer productivity tool that understands your entire codebase and provides context-aware assistance using advanced AI models.

## Features

- 🔍 **Project Ingestion & Analysis** - Automatically scan and understand your codebase
- 💬 **Context-Aware Q&A** - Ask intelligent questions about your code
- 🐛 **Intelligent Debugging** - Get AI-powered insights for debugging
- 🔗 **Dependency Mapping** - Visualize project dependencies
- 👥 **Developer Onboarding** - Accelerate team onboarding
- 📚 **Knowledge Retention** - Build institutional knowledge
- 🤖 **Multiple AI Providers** - Support for Claude, Gemini, OpenAI, and AWS Bedrock

## Tech Stack

**Backend:**
- FastAPI
- Anthropic Claude (default)
- Alternative: Google Gemini, OpenAI, and AWS Bedrock
- FAISS for vector search
- Python 3.12+

**Frontend:**
- React 19
- Vite
- TailwindCSS
- Framer Motion
- Three.js

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- AWS Account with Bedrock access
- Git

### Backend Setup

```bash
cd devsense-backend

# Install dependencies
pip install -r requirements.txt

# Configure your AI provider
# Create .env file with ONE of the following:

# Option 1: Anthropic Claude (Recommended)
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_anthropic_key

# Option 2: Google Gemini (Free tier available)
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Option 3: OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_key

# Option 4: AWS Bedrock
LLM_PROVIDER=bedrock
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1

# Start server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd devsense-frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### Access

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## AI Provider Setup

### Option 1: Anthropic Claude (Recommended)

**Why Claude?**
- ✅ Excellent code understanding
- ✅ Fast and accurate responses
- ✅ Strong reasoning capabilities
- ✅ Great for complex codebases

**Setup:**
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign in and create an account
3. Navigate to API Keys section
4. Create a new API key
5. Add to `.env`:
   ```env
   LLM_PROVIDER=anthropic
   ANTHROPIC_API_KEY=your_api_key_here
   ```

### Option 2: Google Gemini

**Why Gemini?**
- ✅ Free tier with generous limits (15 requests/min, 1M tokens/day)
- ✅ Fast response times
- ✅ Good code understanding
- ✅ No credit card required for free tier

**Setup:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy your API key
5. Add to `.env`:
   ```env
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=your_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   ```

### Option 3: OpenAI

1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. Add to `.env`:
   ```env
   LLM_PROVIDER=openai
   OPENAI_API_KEY=your_api_key_here
   ```

### Option 4: AWS Bedrock

1. Go to AWS Console → Bedrock → Model access
2. Request access to:
   - Claude 3.5 Sonnet
   - Amazon Titan Embeddings
3. Configure AWS credentials in `.env`:
   ```env
   LLM_PROVIDER=bedrock
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_REGION=us-east-1
   ```

## Usage

1. **Ingest Repository**
   - Enter GitHub repository URL
   - Provide project name
   - Wait for ingestion to complete

2. **Ask Questions**
   - "What is this project about?"
   - "How does authentication work?"
   - "Explain the architecture"

3. **View Architecture**
   - Auto-generated after ingestion
   - High-level project overview

## Configuration

### Backend (.env)

```env
# LLM Provider Selection (choose one: anthropic, gemini, openai, bedrock)
LLM_PROVIDER=anthropic

# Anthropic Configuration (if using Claude) - Recommended
ANTHROPIC_API_KEY=your_anthropic_key

# Google Gemini Configuration (if using Gemini)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# OpenAI Configuration (if using OpenAI)
OPENAI_API_KEY=your_openai_key

# AWS Bedrock Configuration (if using Bedrock)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1

# Application Settings
MAX_FILES=10000
MAX_FILE_SIZE=500000
MAX_CHUNKS=10000
EMBED_DIM=1536
```

### Limits

- Max Files: 10,000
- Max File Size: 500 KB
- Max Chunks: 10,000
- Supported Extensions: .py, .js, .ts, .tsx, .jsx, .java, .md, .json, .go, .rb, .php, .c, .cpp, .h, .cs, .swift, .kt, .rs

## API Endpoints

- `GET /` - Health check
- `POST /ingest` - Ingest repository
- `POST /query` - Ask questions about code
- `GET /dependencies` - Get project dependencies
- `GET /file-tree` - Get project file structure
- `POST /feedback` - Submit user feedback
- `GET /settings` - Get backend settings
- `POST /impact-analysis` - Dependency analysis
- `GET /generate-architecture` - Architecture overview

## Project Structure

```
devsense/
├── devsense-backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app
│   │   ├── ingestion.py               # Repository ingestion
│   │   ├── query_engine.py            # Query processing
│   │   ├── embeddings.py              # Embedding generation
│   │   ├── llm_service.py             # LLM router
│   │   ├── llm_service_gemini.py      # Gemini integration
│   │   ├── llm_service_anthropic.py   # Claude integration
│   │   ├── llm_service_openai.py      # OpenAI integration
│   │   ├── llm_service_bedrock.py     # AWS Bedrock integration
│   │   ├── vector_store.py            # FAISS vector store
│   │   ├── dependency_analyzer.py     # Dependency analysis
│   │   └── chat_memory.py             # Chat history
│   ├── data/
│   │   ├── indexes/                   # FAISS indexes
│   │   ├── metadata/                  # Code chunks
│   │   ├── repos/                     # Cloned repos
│   │   └── feedback/                  # User feedback
│   └── requirements.txt
│
└── devsense-frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Landing.jsx            # Landing page
    │   │   └── Dashboard.jsx          # Main app
    │   ├── components/
    │   │   ├── ChatWindow.jsx         # Chat interface
    │   │   ├── Navbar.jsx             # Navigation
    │   │   └── FeatureCard.jsx        # Feature cards
    │   └── api.js                     # API client
    └── package.json
```

## Development

### Backend

```bash
# Run tests
pytest

# Format code
black app/

# Type checking
mypy app/
```

### Frontend

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Deployment

### Backend

```bash
# Using Docker
docker build -t devsense-backend .
docker run -p 8000:8000 devsense-backend

# Using AWS Lambda
# Configure serverless.yml and deploy
serverless deploy
```

### Frontend

```bash
# Build
npm run build

# Deploy to S3/CloudFront
aws s3 sync dist/ s3://your-bucket/
```

## Cost Estimation

### Anthropic Claude (Recommended)
- Small project: ~$1.00
- Medium project: ~$5.00
- Large project: ~$10.00

### Google Gemini
- **Free tier**: 15 requests/min, 1M tokens/day
- **Paid tier**: $0.075 per 1M input tokens, $0.30 per 1M output tokens
- Small project: **FREE**
- Medium project: **FREE** or ~$0.50
- Large project: ~$2.00

### OpenAI
- Small project: ~$0.80
- Medium project: ~$4.00
- Large project: ~$8.00

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Troubleshooting

### Backend won't start
- Check if Python 3.12+ is installed
- Verify all dependencies are installed: `pip install -r requirements.txt`
- Check if `.env` file is configured correctly

### AI responses not working
- Verify your API key is correct in `.env`
- Check if you've selected the right `LLM_PROVIDER`
- Restart the backend after changing `.env`

### Repository ingestion fails
- Check if Git is installed
- Verify the repository URL is correct and accessible
- Check if you have enough disk space

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ for developers
#   a w s  
 