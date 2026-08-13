@echo off
setlocal
cd /d "%~dp0"

echo Lancement du backend Dalili Dentiste...
start "Dalili Backend" cmd /k "cd /d ""%~dp0backend"" && python -m uvicorn app.api:app --host 127.0.0.1 --port 8000"

echo Lancement du frontend Dalili Dentiste...
start "Dalili Frontend" cmd /k "cd /d ""%~dp0frontend"" && if not exist node_modules npm install && npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo Interface: http://127.0.0.1:5173/
echo API:       http://127.0.0.1:8000/api/health
echo.
pause
