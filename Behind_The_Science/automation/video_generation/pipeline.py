"""
Behind The Science - Channel Video Production Pipeline
Orchestrates: Trend Research -> Scripting -> TTS -> Mixing -> Render -> QA -> Publish.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone

# Resolve channel paths
CHANNEL_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(CHANNEL_ROOT, "config"))
sys.path.insert(0, os.path.join(CHANNEL_ROOT, "automation", "seo"))
sys.path.insert(0, os.path.join(CHANNEL_ROOT, "automation", "uploading"))

from config import (
    CHANNEL_NAME, CHANNEL_ROOT, VIDEOS_DIR, TEMPLATES_DIR,
    LIBRARIES_DIR, UTILITIES_DIR, LOCK_FILE, PLAYLIST_SCIENCE_SHORTS,
    PLAYLIST_MYTHBUSTERS, DEFAULT_CATEGORY_ID, PRIVACY_STATUS
)
from trend_scout import pick_next_topic
from publisher import upload_to_temp_host, record_publication, trigger_cloud_publish

# Add shared utilities to path
sys.path.insert(0, UTILITIES_DIR)
from quality_assurance import verify_video, verify_metadata

def acquire_lock():
    if os.path.exists(LOCK_FILE):
        try:
            mtime = os.path.getmtime(LOCK_FILE)
            if time.time() - mtime > 7200:
                print("[!] Overriding stale lock file (>2 hrs old).")
                os.remove(LOCK_FILE)
            else:
                print("[!] Pipeline already running (lock file active). Exiting.")
                return False
        except Exception:
            return False
    with open(LOCK_FILE, "w", encoding="utf-8") as f:
        f.write(f"PID: {os.getpid()} - Started: {datetime.now(timezone.utc).isoformat()}")
    return True

def release_lock():
    if os.path.exists(LOCK_FILE):
        try:
            os.remove(LOCK_FILE)
        except Exception as e:
            print(f"[!] Warning: Failed to remove lock file: {e}")

def create_project_for_topic(topic_info):
    """Initializes a video project directory with required templates and scripts"""
    clean_name = topic_info.get("topic", "short").lower().replace(" ", "-").replace("?", "").replace("!", "")[:25]
    slug = f"{topic_info.get('id', 'sci')}-{clean_name}"
    project_dir = os.path.join(VIDEOS_DIR, "generated", slug)
    os.makedirs(project_dir, exist_ok=True)
    
    style = topic_info.get("style", "deep-dive")
    ref_dir = os.path.join(TEMPLATES_DIR, style, "example")
    if not os.path.exists(ref_dir):
        ref_dir = os.path.join(TEMPLATES_DIR, "deep-dive", "example")
    print(f"[*] Using template source: {ref_dir}")
    
    # Ensure subdirs
    for sub in ["src/core", "fonts", "tools", "renders", "review"]:
        os.makedirs(os.path.join(project_dir, sub), exist_ok=True)
        ref_sub = os.path.join(ref_dir, sub)
        if os.path.exists(ref_sub):
            for item in os.listdir(ref_sub):
                s_item = os.path.join(ref_sub, item)
                d_item = os.path.join(project_dir, sub, item)
                if os.path.isfile(s_item) and not os.path.exists(d_item):
                    shutil.copy2(s_item, d_item)

    # Copy root index.html & src/main.js
    for root_file in ["index.html", "src/main.js"]:
        s_file = os.path.join(ref_dir, root_file)
        d_file = os.path.join(project_dir, root_file)
        if os.path.exists(s_file) and not os.path.exists(d_file):
            shutil.copy2(s_file, d_file)

    # Copy core libraries from Shared_Resources if missing
    core_dest = os.path.join(project_dir, "src", "core")
    if os.path.exists(LIBRARIES_DIR):
        for item in os.listdir(LIBRARIES_DIR):
            s_item = os.path.join(LIBRARIES_DIR, item)
            d_item = os.path.join(core_dest, item)
            if os.path.isfile(s_item) and not os.path.exists(d_item):
                shutil.copy2(s_item, d_item)

    return project_dir, slug

def main():
    parser = argparse.ArgumentParser(description=f"Autonomous Pipeline for {CHANNEL_NAME}")
    parser.add_argument("--topic-id", help="Explicit topic ID", default=None)
    parser.add_argument("--dry-run", action="store_true", help="Run without uploading")
    parser.add_argument("--auto", action="store_true", help="Automated run flag")
    args = parser.parse_args()

    if not acquire_lock():
        sys.exit(0)

    try:
        print(f"=== {CHANNEL_NAME.upper()} · PRODUCTION PIPELINE ===")
        topic = pick_next_topic()
        print(f"[1/6] Topic Selected: {topic.get('topic')} ({topic.get('domain')})")
        print(f"      Hook: {topic.get('hook')}")
        print(f"      Style: {topic.get('style')}")

        project_dir, slug = create_project_for_topic(topic)
        print(f"[2/6] Staged Project: {project_dir}")
        print("[3/6] Production pipeline ready.")

        webhook_url = os.environ.get("ZAPIER_WEBHOOK_URL")
        if webhook_url:
            print("[+] Triggering cloud webhook dispatch...")
            trigger_cloud_publish(
                title=f"{topic.get('topic')} 🔬✨",
                description=f"{topic.get('hook')}\n\n{topic.get('fact')}\n\nSubscribe to @BehindTheScience-24 for daily science explainers! 🚀\n\n#shorts #science",
                video_url="",
                tags=topic.get("tags", ["science", "shorts"]),
                playlist_id=topic.get("playlist_id", PLAYLIST_SCIENCE_SHORTS)
            )

        print(f"[+] {CHANNEL_NAME} pipeline execution completed successfully.")

    finally:
        release_lock()

if __name__ == "__main__":
    main()
