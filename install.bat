@echo off
title KAD Planning — First Time Setup
echo ===================================================
echo     KAD Planning System — Installation
echo ===================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Check if Git is installed
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git is not installed!
    echo Please download and install Git from: https://git-scm.com
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js found: 
node --version
echo [OK] Git found: 
git --version
echo.

:: Clone the repository if not already cloned
if not exist ".git" (
    echo Cloning repository from GitHub...
    git clone https://github.com/Tanvirshakil607159/KAD-PLANNING.git .
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to clone repository!
        pause
        exit /b 1
    )
)

echo.
echo Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo Building the application...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo ===================================================
echo     Installation Complete!
echo ===================================================
echo.
echo Next steps:
echo   1. Double-click "Run_KAD_Planning.bat" to start
echo   2. Use "update.bat" to get future updates
echo.
pause
