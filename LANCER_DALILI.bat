@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "BACKEND_URL=http://127.0.0.1:8000"
set "FRONTEND_URL=http://127.0.0.1:5173"
set "FASTAPI_BASE_URL=%BACKEND_URL%"

echo ==========================================
echo   Dalili Dentiste Tounsi - lancement local
echo ==========================================
echo.
echo Frontend : %FRONTEND_URL%
echo Backend  : %BACKEND_URL%/api/health
echo.

where python >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Python est introuvable dans le PATH.
  echo Installe Python ou ajoute-le au PATH, puis relance ce fichier.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] npm est introuvable dans le PATH.
  echo Installe Node.js, puis relance ce fichier.
  pause
  exit /b 1
)

if not exist "%~dp0backend\database\dentists_tunisia.db" (
  echo [INFO] Base SQLite non trouvee :
  echo        %~dp0backend\database\dentists_tunisia.db
  echo        L'API peut demarrer, mais les donnees risquent d'etre vides.
  echo.
)

echo Lancement du backend FastAPI...
start "Dalili Backend" cmd /k "cd /d ""%~dp0backend"" && python -m pip install -r requirements.txt && python -m uvicorn app.api:app --host 127.0.0.1 --port 8000 --reload"

echo Lancement du frontend Lovable/Vite...
start "Dalili Frontend" cmd /k "cd /d ""%~dp0frontend"" && if not exist node_modules npm install && set ""FASTAPI_BASE_URL=%BACKEND_URL%"" && npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo Attente du demarrage des serveurs...
timeout /t 8 /nobreak >nul

echo Ouverture de l'interface...
start "" "%FRONTEND_URL%"

echo.
echo Si le navigateur s'ouvre trop vite, attends quelques secondes puis actualise.
echo Frontend : %FRONTEND_URL%
echo Backend  : %BACKEND_URL%/api/health
echo.
pause
