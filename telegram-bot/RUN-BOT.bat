@echo off
cd /d "%~dp0"
py bot.py
if errorlevel 1 (
  echo.
  echo Bot exited. Check the message above, then press any key.
  pause >nul
)
