@echo off
setlocal
echo ====================================
echo    DermAI Application Startup
echo ====================================
echo.

set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."

echo 🔧 Checking Python virtual environment...
cd /d "%PROJECT_ROOT%\backend"
if not exist "venv\Scripts\python.exe" (
    echo ❌ Virtual environment not found in backend\venv!
    echo Please create virtual environment first.
    pause
    exit /b 1
)

echo ✅ Virtual environment found.
echo.

echo 🚀 Starting Flask Backend Server...
echo Server will be available at: http://localhost:5002
echo.
start "DermAI Backend" cmd /k ".\venv\Scripts\activate.bat && python app.py"

echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo 🌐 Starting React Frontend Server...
echo Server will be available at: http://localhost:5176/
echo.
cd /d "%PROJECT_ROOT%"
start "DermAI Frontend" cmd /k "npm run dev"

echo ⏳ Waiting for frontend to start...
timeout /t 5 /nobreak >nul

echo.
echo 📊 Server Status:
echo ================
echo Backend:  http://localhost:5002/api/health
echo Frontend: http://localhost:5176/
echo.
echo 🎯 DermAI Application should now be running!
echo.
echo Opening browser...
start "" "http://localhost:5176/"

echo Keep the server windows open.
pause
