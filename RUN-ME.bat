@echo off
title Pinjal River Tracker
cd /d "%~dp0"

echo ============================================
echo   Pinjal River Tracker - build v5
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed.
  echo Download the LTS version from https://nodejs.org  then run this file again.
  echo.
  pause
  exit /b 1
)

echo [1/3] Clearing any stale build cache...
if exist ".next" rmdir /s /q ".next"

echo [2/3] Installing dependencies (first run takes a few minutes)...
call npm install --no-audit --no-fund
if errorlevel 1 (
  echo.
  echo npm install failed. Check your internet connection and try again.
  pause
  exit /b 1
)

echo [3/3] Starting the dashboard...
echo.
echo   Opening http://localhost:3000
echo   Leave this window open. Press Ctrl+C here to stop.
echo.
start "" http://localhost:3000
call npm run dev
pause
