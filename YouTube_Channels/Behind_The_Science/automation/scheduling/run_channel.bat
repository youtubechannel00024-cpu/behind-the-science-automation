@echo off
title Behind The Science - Channel Scheduler
echo ===================================================================
echo YouTube Channel: Behind The Science (@behindthescience-24)
echo Mode: Channel Autonomous Scheduler
echo ===================================================================
echo.
cd /d "%~dp0"
"d:\Youtube\.faceless-shorts\venv\Scripts\python.exe" scheduler.py
pause
