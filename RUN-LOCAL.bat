@echo off
start "Study Hub Junction preview" powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\preview.ps1"
timeout /t 2 /nobreak >nul
start "" "http://localhost:4173/"
