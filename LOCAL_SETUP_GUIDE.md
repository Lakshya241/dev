# DevSense Local Development Setup Guide

## Issues Fixed
1. ✅ Frontend API now points to localhost backend
2. ✅ DependencyGraph re-enabled
3. ✅ Logs directory setup
4. ✅ All backend directories created

## Prerequisites
- Python 3.8+
- Node.js 16+
- Git

## Backend Setup

### 1. Navigate to backend directory
```bash
cd devsense-backend
```

### 2. Create virtual environment (recommended)
```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On Mac/Linux
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Setup directories
```bash
python setup_directories.py
```

### 5. Configure environment variables
The `.env` file is already configured. Make sure these are set:
- `LLM_PROVIDER=gemini`
- `GEMINI_API_KEY=your_key_here`

### 6. Start the backend server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`

## Frontend Setup

### 1. Navigate to frontend directory
```bash
cd devsense-frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Install D3.js (for dependency graph)
```bash
npm install d3
```

### 4. Configure environment
The `.env` file is already created and points to `http://localhost:8000`

### 5. Start the development server
```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

## Testing the Setup

### 1. Check Backend Health
Open browser: `http://localhost:8000`
Should see: `{"status":"DevSense backend running"}`

### 2. Check Frontend
Open browser: `http://localhost:5173`
Should see the DevSense landing page

### 3. Test Features

#### Ingest a Repository
1. Go to Dashboard (`/app`)
2. Enter a GitHub repo URL (e.g., `https://github.com/user/repo`)
3. Enter a project name
4. Click "Ingest Repository"

#### View Activity Logs
1. Click "Activity Logs" in the sidebar
2. Should see ingestion activities

#### View Dependency Graph
1. Click "Dependency Map" in the sidebar
2. Should see an interactive graph (drag nodes to see physics)

## Common Issues & Solutions

### Issue: Backend not responding
**Solution:**
```bash
cd devsense-backend
python setup_directories.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Issue: Frontend can't connect to backend
**Solution:**
Check `devsense-frontend/.env` has:
```
VITE_API_URL=http://localhost:8000
```
Then restart frontend:
```bash
npm run dev
```

### Issue: Logs not visible
**Solution:**
1. Make sure backend is running
2. Ingest a project first (logs are per-project)
3. Check `devsense-backend/data/logs/` directory exists

### Issue: Dependency graph not showing
**Solution:**
```bash
cd devsense-frontend
npm install d3
npm run dev
```

### Issue: CORS errors
**Solution:**
Backend already has CORS configured for localhost:5173
If using different port, update `devsense-backend/app/main.py`:
```python
allow_origins=[
    "http://localhost:5173",  # Vite default
    "http://localhost:3000",  # Alternative
    # Add your port here
]
```

## Production Deployment

### Backend (Render)
- Already deployed at: `https://devsense1.onrender.com`
- Environment variables set in Render dashboard

### Frontend (Vercel)
- Create `.env.production` with:
```
VITE_API_URL=https://devsense1.onrender.com
```
- Or set in Vercel dashboard

## File Structure
```
devsense-backend/
├── app/
│   ├── main.py              # FastAPI app with all endpoints
│   ├── llm_service.py       # LLM router
│   ├── llm_service_gemini.py
│   └── ...
├── data/
│   ├── repos/               # Cloned repositories
│   ├── indexes/             # Vector indexes
│   ├── metadata/            # Project metadata
│   ├── feedback/            # User feedback
│   └── logs/                # Activity logs
├── .env                     # Environment variables
└── requirements.txt

devsense-frontend/
├── src/
│   ├── pages/
│   │   ├── Landing.jsx
│   │   └── Dashboard.jsx
│   ├── components/
│   │   ├── LogsPanel.jsx
│   │   └── DependencyGraph.jsx
│   └── api.js               # API client
├── .env                     # Points to localhost:8000
└── package.json
```

## Next Steps
1. Start backend: `cd devsense-backend && uvicorn app.main:app --reload`
2. Start frontend: `cd devsense-frontend && npm run dev`
3. Open browser: `http://localhost:5173`
4. Test by ingesting a small GitHub repo
5. Check logs and dependency graph features

## Support
If you encounter issues:
1. Check both backend and frontend terminals for errors
2. Verify `.env` files are configured correctly
3. Ensure all dependencies are installed
4. Check that ports 8000 and 5173 are not in use
