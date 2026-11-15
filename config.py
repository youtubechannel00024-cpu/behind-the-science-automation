"""
Autonomous YouTube Agent Configuration
Channel: Behind The Science (@behindthescience-24)
"""
import os
import sys
import shutil

# Channel Metadata
CHANNEL_NAME = "Behind The Science"
CHANNEL_HANDLE = "@behindthescience-24"
CHANNEL_ID = "UCXOcwa_0V2tSyPonkbOeSIA"
CONTACT_EMAIL = "youtubechannel00024@gmail.com"

# Core Channel Playlists
PLAYLIST_SCIENCE_SHORTS = "PLEZgc6prAhD0"   # What REALLY Happens? | 3D Science Shorts
PLAYLIST_MYTHBUSTERS = "PLLSGxsK9q3tY"      # Mythbusters & Bizarre Facts | Science Explained

# Cross-Platform Base Paths (Windows & Linux / GitHub Actions)
AGENT_ROOT = os.path.dirname(os.path.abspath(__file__))
if os.path.basename(AGENT_ROOT) == "autonomous_agent":
    WORKSPACE_ROOT = os.path.dirname(AGENT_ROOT)
else:
    WORKSPACE_ROOT = AGENT_ROOT

PROJECTS_DIR = os.path.join(WORKSPACE_ROOT, "projects")
os.makedirs(PROJECTS_DIR, exist_ok=True)

FFMPEG = shutil.which("ffmpeg") or (r"d:\Youtube\bin\ffmpeg.exe" if os.path.exists(r"d:\Youtube\bin\ffmpeg.exe") else "ffmpeg")
FFPROBE = shutil.which("ffprobe") or (r"d:\Youtube\bin\ffprobe.exe" if os.path.exists(r"d:\Youtube\bin\ffprobe.exe") else "ffprobe")
PYTHON_VENV = sys.executable

# Skill root (resolves both in local setup and in GitHub repo)
_candidate_skills = [
    os.path.join(WORKSPACE_ROOT, "styles"),
    os.path.join(WORKSPACE_ROOT, "skills", "faceless-shorts"),
    os.path.join(WORKSPACE_ROOT, ".agents", "skills", "faceless-shorts"),
    r"d:\Youtube\.agents\skills\faceless-shorts"
]
SKILL_ROOT = next((p for p in _candidate_skills if os.path.exists(p)), _candidate_skills[0])

# Publishing Settings
DEFAULT_CATEGORY_ID = "28"  # Science & Technology
DEFAULT_LANGUAGE = "en"
PRIVACY_STATUS = "public"
MADE_FOR_KIDS = False

# Schedule & Policy Guardrails
INTERVAL_HOURS = 6
MAX_DURATION_SECONDS = 59.9
MIN_DURATION_SECONDS = 20.0

# Tracking Files
HISTORY_FILE = os.path.join(AGENT_ROOT, "published_history.json")
TOPICS_FILE = os.path.join(AGENT_ROOT, "topic_database.json")
LOG_FILE = os.path.join(AGENT_ROOT, "automation.log")
LOCK_FILE = os.path.join(AGENT_ROOT, "agent.lock")
