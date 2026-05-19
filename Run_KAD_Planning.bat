@echo off
title KAD Planning System
echo ===================================================
echo     Starting KAD Production Planning System
echo ===================================================
echo.
echo Initializing desktop application...
echo.
echo Press Ctrl+C in this window to close.
echo.

if not exist "dist\index.html" (
    echo [INFO] Built files not found. Building the application...
    call npm run build
)

call npx electron .

pause
