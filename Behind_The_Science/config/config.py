"""
Behind The Science - Channel Configuration Module
Dynamically loads JSON settings and exports constants for automation modules.
"""
import json
import os
import shutil
import sys

CONFIG_DIR = os.path.dirname(os.path.abspath(__file__))
CHANNEL_ROOT = os.path.dirname(CONFIG_DIR)
YOUTUBE_CHANNELS_DIR = os.path.dirname(CHANNEL_ROOT)
WORKSPACE_ROOT = os.path.dirname(YOUTUBE_CHANNELS_DIR)

def _load(path):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

CHANNEL_SETTINGS = _load(os.path.join(CONFIG_DIR, "channel_settings", "channel_config.json"))
SEO_SETTINGS = _load(os.path.join(CONFIG_DIR, "seo_settings", "seo_defaults.json"))
SCHEDULE_SETTINGS = _load(os.path.join(CONFIG_DIR, "automation_settings", "schedule_config.json"))

# Channel Metadata
CHANNEL_NAME = CHANNEL_SETTINGS.get("channel_name", "Behind The Science")
CHANNEL_HANDLE = CHANNEL_SETTINGS.get("channel_handle", "@behindthescience-24")
CHANNEL_ID = CHANNEL_SETTINGS.get("channel_id", "UCXOcwa_0V2tSyPonkbOeSIA")
CONTACT_EMAIL = CHANNEL_SETTINGS.get("contact_email", "youtubechannel00024@gmail.com")
NICHE = CHANNEL_SETTINGS.get("niche", "Science & Education")

# Playlists
PLAYLIST_SCIENCE_SHORTS = CHANNEL_SETTINGS.get("playlists", {}).get("science_shorts", "PLEZgc6prAhD0")
PLAYLIST_MYTHBUSTERS = CHANNEL_SETTINGS.get("playlists", {}).get("mythbusters", "PLLSGxsK9q3tY")

# Base System Paths
SHARED_DIR = os.path.join(WORKSPACE_ROOT, "Shared_Resources")
TEMPLATES_DIR = os.path.join(SHARED_DIR, "reusable_templates")
LIBRARIES_DIR = os.path.join(SHARED_DIR, "common_libraries")
UTILITIES_DIR = os.path.join(SHARED_DIR, "common_utilities")

BIN_DIR = os.path.join(WORKSPACE_ROOT, "bin")
FFMPEG = shutil.which("ffmpeg") or (os.path.join(BIN_DIR, "ffmpeg.exe") if os.path.exists(os.path.join(BIN_DIR, "ffmpeg.exe")) else "ffmpeg")
FFPROBE = shutil.which("ffprobe") or (os.path.join(BIN_DIR, "ffprobe.exe") if os.path.exists(os.path.join(BIN_DIR, "ffprobe.exe")) else "ffprobe")
PYTHON_VENV = sys.executable

# Channel Specific Directories
CONTENT_DIR = os.path.join(CHANNEL_ROOT, "content")
VIDEOS_DIR = os.path.join(CHANNEL_ROOT, "videos")
ASSETS_DIR = os.path.join(CHANNEL_ROOT, "assets")
AUTOMATION_DIR = os.path.join(CHANNEL_ROOT, "automation")
ANALYTICS_DIR = os.path.join(CHANNEL_ROOT, "analytics")
LOGS_DIR = os.path.join(CHANNEL_ROOT, "logs")

# Core Data Files
TOPICS_FILE = os.path.join(CONTENT_DIR, "trending_topics", "topic_database.json")
HISTORY_FILE = os.path.join(ANALYTICS_DIR, "published_history.json")
LOG_FILE = os.path.join(LOGS_DIR, "automation.log")
LOCK_FILE = os.path.join(AUTOMATION_DIR, "scheduling", "channel.lock")

# Guardrails
INTERVAL_HOURS = SCHEDULE_SETTINGS.get("interval_hours", 6)
MIN_DURATION_SECONDS = SCHEDULE_SETTINGS.get("min_duration_seconds", 20.0)
MAX_DURATION_SECONDS = SCHEDULE_SETTINGS.get("max_duration_seconds", 59.9)
DEFAULT_CATEGORY_ID = CHANNEL_SETTINGS.get("default_category_id", "28")
PRIVACY_STATUS = CHANNEL_SETTINGS.get("privacy_status", "public")
MADE_FOR_KIDS = CHANNEL_SETTINGS.get("made_for_kids", False)
