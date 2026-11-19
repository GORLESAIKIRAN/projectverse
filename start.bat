@echo off
title GSK MEDIAVERSE - All-in-One Video & Audio Studio
cls
echo =========================================================================
echo              GSK MEDIAVERSE - ALL-IN-ONE MEDIA STUDIO
echo          "Everything Media. One Powerful Studio."
echo =========================================================================
echo.
echo [1/3] Initializing High-Performance Studio Engine...
set ELECTRON_RUN_AS_NODE=1
set PORT=3000

echo [2/3] Launching Web Browser at http://localhost:3000 ...
start "" "http://localhost:3000"

echo [3/3] Starting Unified Media Server...
"C:\Users\saiki\AppData\Local\Programs\antigravity\Antigravity.exe" "%~dp0server.js"

pause
