@echo off
title Behind The Science - Autonomous YouTube Agent
echo ===================================================================
echo Behind The Science (@behindthescience-24) - Autonomous Agent Service
echo ===================================================================
echo.
cd /d "d:\Youtube\autonomous_agent"
"d:\Youtube\.faceless-shorts\venv\Scripts\python.exe" scheduler.py
pause
