@echo off
echo ========================================
echo DevSense Local Development Startup
echo ========================================
echo.

echo [1/4] Setting up backend directories...
cd devsense-backend
python setup_directories.py
echo.

echo [2/4] Starting backend server...
echo Backend will run at: http://localhost:8000
start cmd /k "cd devsense-backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak > nul
echo.

echo [3/4] Installing frontend dependencies (if needed)...
cd ..\devsense-frontend
if not exist "node_modules" (
    echo Installing npm packages...
    call npm install
)
if not exist "node_modules\d3" (
    echo Installing d3...
    call npm install d3
)
echo.

echo [4/4] Starting frontend server...
echo Frontend will run at: http://localhost:5173
start cmd /k "cd devsense-frontend && npm run dev"
echo.

echo ========================================
echo ✅ DevSense is starting!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit this window...
pause > nul
