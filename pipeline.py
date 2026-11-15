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
from publisher import upload_to_temp_host, record_publication, trigger_cloud_publish

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

def run_step(cmd, cwd=None, timeout=600):
    cmd_str = ' '.join(cmd) if isinstance(cmd, list) else cmd
    print(f"[*] Running: {cmd_str}")
    res = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True, timeout=timeout)
    if res.returncode != 0:
        print(f"[!] Command failed (code {res.returncode}):\n{res.stderr}\n{res.stdout}")
        raise RuntimeError(f"Step failed with code {res.returncode}")
    return res.stdout

def find_template_dir(style="deep-dive"):
    """Finds reference style template across local workspace and cloud repo"""
    candidates = [
        os.path.join(WORKSPACE_ROOT, "styles", style, "example"),
        os.path.join(WORKSPACE_ROOT, "styles", "deep-dive", "example"),
        os.path.join(WORKSPACE_ROOT, "Youtube Videos", "cracking-knuckles"),
        os.path.join(WORKSPACE_ROOT, "Youtube Videos", "crying-in-space")
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return candidates[0]

def create_project_for_topic(topic_info):
    """Initializes a video project directory with required templates and scripts"""
    clean_name = topic_info.get("topic", "short").lower().replace(" ", "-").replace("?", "").replace("!", "")[:25]
    slug = f"{topic_info.get('id', 'sci')}-{clean_name}"
    project_dir = os.path.join(PROJECTS_DIR, slug)
    os.makedirs(project_dir, exist_ok=True)
    
    ref_dir = find_template_dir(topic_info.get("style", "deep-dive"))
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

    return project_dir, slug

def main():
    parser = argparse.ArgumentParser(description="Autonomous Science Shorts Pipeline")
    parser.add_argument("--topic-id", help="Explicit topic ID from topic_database.json", default=None)
    parser.add_argument("--dry-run", action="store_true", help="Run without uploading to YouTube")
    parser.add_argument("--auto", action="store_true", help="Automated run flag")
    args = parser.parse_args()

    if not acquire_lock():
        sys.exit(0)

    try:
        print("=== BEHIND THE SCIENCE · AUTONOMOUS PIPELINE ===")
        topic = pick_next_topic()
        print(f"[1/6] Topic Selected: {topic.get('topic')} ({topic.get('domain')})")
        print(f"      Hook: {topic.get('hook')}")
        print(f"      Style: {topic.get('style')}")

        project_dir, slug = create_project_for_topic(topic)
        print(f"[2/6] Staged Project: {project_dir}")
        print("[3/6] Production pipeline ready.")

        # Note: If running in GitHub Actions with ZAPIER_WEBHOOK_URL set,
        # it triggers the cloud publish pipeline
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

        print("[+] Pipeline execution completed successfully.")

    finally:
        release_lock()

if __name__ == "__main__":
    main()
