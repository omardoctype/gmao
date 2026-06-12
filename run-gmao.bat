@echo off
setlocal EnableExtensions

title Starting GMAO platform...
echo =====================================
echo Starting GMAO platform...
echo =====================================

set "ROOT_DIR=%~dp0"
set "OLLAMA_URL=http://127.0.0.1:11434"
set "AI_URL=http://127.0.0.1:8000"
set "BACKEND_URL=http://127.0.0.1:8080"
set "FRONTEND_URL=http://127.0.0.1:5173"
set "OLLAMA_MODEL=qwen2.5:1.5b"

echo.
echo [1/6] Checking Ollama...
curl -s "%OLLAMA_URL%/api/tags" >nul 2>&1
if errorlevel 1 (
  echo Ollama is not responding. Starting Ollama in a new window...
  start "GMAO - Ollama" cmd /k "ollama serve"
  call :waitSeconds 5
) else (
  echo Ollama is already running.
)

echo.
echo [2/6] Verifying Ollama availability...
curl -s "%OLLAMA_URL%/api/tags" >nul 2>&1
if errorlevel 1 (
  echo [WARN] Ollama is still not reachable at %OLLAMA_URL%.
  echo [WARN] You can start it manually with: ollama serve
) else (
  echo Ollama is reachable.
)

echo.
echo [3/6] Checking model %OLLAMA_MODEL%...
ollama list | findstr /I /C:"%OLLAMA_MODEL%" >nul 2>&1
if errorlevel 1 (
  echo Model %OLLAMA_MODEL% is missing. Run: ollama pull %OLLAMA_MODEL%
) else (
  echo Model %OLLAMA_MODEL% is installed.
)

echo.
echo [4/6] Starting ai-service...
start "GMAO - AI Service" /D "%ROOT_DIR%ai-service" cmd /k "if exist .venv\Scripts\python.exe (.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000) else (echo [WARN] ai-service\.venv\Scripts\python.exe not found. Running with global Python environment. && uvicorn app.main:app --reload --port 8000)"
call :waitSeconds 4

echo.
echo [5/6] Starting backend Spring Boot...
start "GMAO - Backend" /D "%ROOT_DIR%backend" cmd /k "mvn spring-boot:run"
call :waitSeconds 4

echo.
echo [6/6] Starting frontend React...
start "GMAO - Frontend" /D "%ROOT_DIR%frontend" cmd /k "npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo =====================================
echo GMAO local platform startup requested.
echo =====================================
echo Frontend:  %FRONTEND_URL%
echo Backend:   %BACKEND_URL%
echo AI Service:%AI_URL%/health
echo Ollama:    %OLLAMA_URL%/api/tags
echo.
echo Logs remain visible in the opened windows.

endlocal
exit /b 0

:waitSeconds
powershell -NoProfile -Command "Start-Sleep -Seconds %~1" >nul 2>&1
exit /b 0
