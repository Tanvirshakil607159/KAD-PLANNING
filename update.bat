@echo off
title KAD Planning — Updater
echo ===================================================
echo     KAD Planning System — Update Tool
echo ===================================================
echo.
echo Pulling latest version from GitHub...
echo.

:: Pull latest code from GitHub
git pull origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to pull from GitHub!
    echo Make sure you have git installed and the repo is properly configured.
    echo.
    pause
    exit /b 1
)

echo.
echo Installing / updating dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to install dependencies!
    echo.
    pause
    exit /b 1
)

echo.
echo Building the application...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed!
    echo.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo     Update Complete!
echo ===================================================
echo.
echo You can now run the application.
echo.
pause
