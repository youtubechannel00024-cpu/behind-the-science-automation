"""
Master Autonomous Production Pipeline for Behind The Science
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

from config import (
    WORKSPACE_ROOT, PROJECTS_DIR, AGENT_ROOT, LOCK_FILE,
    TOPICS_FILE, HISTORY_FILE, PLAYLIST_SCIENCE_SHORTS, PLAYLIST_MYTHBUSTERS,
    DEFAULT_CATEGORY_ID, PRIVACY_STATUS
)
from trend_scout import pick_next_topic
from quality_assurance import verify_video, verify_metadata
from publisher import upload_to_temp_host, record_publication

def acquire_lock():
    if os.path.exists(LOCK_FILE):
        # Check if stale (older than 2 hours)
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

def run_step(cmd, cwd=None, timeout=600):
    print(f"[*] Running: {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    res = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True, timeout=timeout)
    if res.returncode != 0:
        print(f"[!] Command failed (code {res.returncode}):\n{res.stderr}\n{res.stdout}")
        raise RuntimeError(f"Step failed with code {res.returncode}")
    return res.stdout

def create_project_for_topic(topic_info):
    """Initializes a video project directory with required templates and scripts"""
    slug = topic_info.get("id", "sci-auto") + "-" + topic_info.get("topic", "short").lower().replace(" ", "-").replace("?", "").replace("!", "")[:25]
    project_dir = os.path.join(PROJECTS_DIR, slug)
    os.makedirs(project_dir, exist_ok=True)
    
    # Template source (using crying-in-space or cracking-knuckles base)
    ref_dir = os.path.join(PROJECTS_DIR, "cracking-knuckles")
    
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

    return project_dir, slug

def main():
    parser = argparse.ArgumentParser(description="Autonomous Science Shorts Pipeline")
    parser.add_argument("--topic-id", help="Explicit topic ID from topic_database.json", default=None)
    parser.add_argument("--dry-run", action="store_true", help="Run without uploading to YouTube")
    args = parser.parse_args()

    if not acquire_lock():
        sys.exit(1)

    try:
        print("=== BEHIND THE SCIENCE · AUTONOMOUS PIPELINE ===")
        topic = pick_next_topic()
        print(f"[1/6] Topic Selected: {topic.get('topic')} ({topic.get('domain')})")
        print(f"      Hook: {topic.get('hook')}")
        print(f"      Style: {topic.get('style')}")

        project_dir, slug = create_project_for_topic(topic)
        print(f"[2/6] Staged Project: {project_dir}")

        # Quality Assurance & Execution flow
        print("[+] Ready for media rendering and QA checks.")

    finally:
        release_lock()

if __name__ == "__main__":
    main()
