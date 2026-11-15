"""
Autonomous YouTube Agent Configuration
Channel: Behind The Science (@behindthescience-24)
"""
import os

# Channel Metadata
CHANNEL_NAME = "Behind The Science"
CHANNEL_HANDLE = "@behindthescience-24"
CHANNEL_ID = "UCXOcwa_0V2tSyPonkbOeSIA"
CONTACT_EMAIL = "youtubechannel00024@gmail.com"

# Core Channel Playlists
PLAYLIST_SCIENCE_SHORTS = "PLEZgc6prAhD0"   # What REALLY Happens? | 3D Science Shorts
PLAYLIST_MYTHBUSTERS = "PLLSGxsK9q3tY"      # Mythbusters & Bizarre Facts | Science Explained

# Base Paths
WORKSPACE_ROOT = r"d:\Youtube"
AGENT_ROOT = os.path.join(WORKSPACE_ROOT, "autonomous_agent")
PROJECTS_DIR = os.path.join(WORKSPACE_ROOT, "Youtube Videos")
BIN_DIR = os.path.join(WORKSPACE_ROOT, "bin")
FFMPEG = os.path.join(BIN_DIR, "ffmpeg.exe")
FFPROBE = os.path.join(BIN_DIR, "ffprobe.exe")
PYTHON_VENV = os.path.join(WORKSPACE_ROOT, ".faceless-shorts", "venv", "Scripts", "python.exe")
SKILL_ROOT = os.path.join(WORKSPACE_ROOT, ".agents", "skills", "faceless-shorts")

# Publishing Settings
DEFAULT_CATEGORY_ID = "28"  # Science & Technology
DEFAULT_LANGUAGE = "en"
PRIVACY_STATUS = "public"
MADE_FOR_KIDS = False

# Schedule & Policy Guardrails
# 4 videos per day (every 6 hours) is optimal for YouTube Partner Program compliance
# (Prevents "Repetitive / Inauthentic Content" flagging and avoids API quota limits)
INTERVAL_HOURS = 6
MAX_DURATION_SECONDS = 59.9
MIN_DURATION_SECONDS = 20.0

# Tracking Files
HISTORY_FILE = os.path.join(AGENT_ROOT, "published_history.json")
TOPICS_FILE = os.path.join(AGENT_ROOT, "topic_database.json")
LOG_FILE = os.path.join(AGENT_ROOT, "automation.log")
LOCK_FILE = os.path.join(AGENT_ROOT, "agent.lock")
