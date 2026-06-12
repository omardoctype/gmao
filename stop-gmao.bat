@echo off
setlocal EnableExtensions

title Stopping GMAO platform...
echo =====================================
echo Stopping GMAO platform...
echo =====================================
echo [WARN] This script may stop other local Java/Node/Python processes
echo        if they use ports 8080, 5173 or 8000.
echo.

echo [1/2] Closing GMAO service windows if running...
call :killByTitle "GMAO - Frontend"
call :killByTitle "GMAO - Backend"
call :killByTitle "GMAO - AI Service"
call :killByTitle "GMAO - Ollama"

echo.
echo [2/2] Releasing GMAO ports (5173, 8080, 8000) if needed...
call :killByPort 5173
call :killByPort 8080
call :killByPort 8000

echo.
echo No data folders are deleted by this script.
echo - MySQL data preserved
echo - chroma_db preserved
echo - documents preserved
echo - uploads preserved
echo.
echo GMAO local services stopped.
endlocal
exit /b 0

:killByTitle
set "WTITLE=%~1"
taskkill /FI "WINDOWTITLE eq %WTITLE%" /T /F >nul 2>&1
if errorlevel 1 (
  echo - %WTITLE%: no matching window found.
) else (
  echo - %WTITLE%: stopped.
)
exit /b 0

:killByPort
set "PORT=%~1"
set "FOUND_PID=false"

for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
  set "FOUND_PID=true"
  taskkill /PID %%P /T /F >nul 2>&1
  if errorlevel 1 (
    echo - Port %PORT%: process %%P could not be stopped.
  ) else (
    echo - Port %PORT%: process %%P stopped.
  )
)

if /I "%FOUND_PID%"=="false" (
  echo - Port %PORT%: no listening process found.
)

exit /b 0
