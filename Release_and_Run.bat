@echo off
title KAD Planning — Release Manager & System Launcher
echo ===================================================
echo     KAD Production Planning System — Release Manager
echo ===================================================
echo.
node scripts/release.cjs
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Release process failed!
    echo.
)
pause
