@echo off
title Master YouTube Multi-Channel Automation Daemon
echo ===================================================================
echo MASTER MULTI-CHANNEL AUTOMATION DAEMON
echo Managing all channels in d:\Youtube\YouTube_Channels\
echo ===================================================================
echo.
cd /d "%~dp0"
"d:\Youtube\.faceless-shorts\venv\Scripts\python.exe" master_scheduler.py
pause
