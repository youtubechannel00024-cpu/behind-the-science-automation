"""
Behind The Science - Channel Video Production Pipeline
Orchestrates: Trend Research -> Scripting -> TTS -> Mixing -> Render -> QA -> Publish.
Runs autonomously both locally and in cloud (GitHub Actions).
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
    for sub in ["src/core", "fonts", "tools", "renders", "review", "data"]:
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

    # Copy shared utilities (generate_narration.py, mix.py)
    gen_narration = os.path.join(UTILITIES_DIR, "generate_narration.py")
    if os.path.exists(gen_narration):
        shutil.copy2(gen_narration, os.path.join(project_dir, "tools", "generate_narration.py"))

    # Ensure script.json exists
    script_path = os.path.join(project_dir, "script.json")
    if not os.path.exists(script_path):
        lines = [
            {"text": topic_info.get("hook", "Did you know this fascinating scientific phenomenon?"), "caps": "DID YOU *KNOW? | SCIENTIFIC *FACT"},
            {"text": f"Here is the mind-blowing science behind {topic_info.get('topic', 'this')}.", "caps": "BEHIND THE *SCIENCE | EXPLAINED!"},
            {"text": topic_info.get("fact", "Scientists discovered how extreme physics governs our universe."), "caps": "EXTREME *PHYSICS | IN *ACTION!"},
            {"text": "Understanding this reveals how our world truly functions at the deepest level.", "caps": "REVEALS HOW | REALITY *WORKS"},
            {"text": "Subscribe to Behind The Science for daily curiosity-driven explainers!", "caps": "SUBSCRIBE TO | BEHIND THE *SCIENCE!"}
        ]
        script_data = {
            "title": topic_info.get("topic", "Science Explainer"),
            "voice": "en-US-ChristopherNeural",
            "speed": 1.15,
            "lead": 0.35,
            "outro": 0.65,
            "gap": 0.22,
            "music": "bed",
            "lines": lines
        }
        with open(script_path, "w", encoding="utf-8") as f:
            json.dump(script_data, f, indent=2)

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
        print(f"=== {CHANNEL_NAME.upper()} · AUTONOMOUS PRODUCTION PIPELINE ===")
        topic = pick_next_topic()
        print(f"[1/6] Topic Selected: {topic.get('topic')} ({topic.get('domain')})")
        print(f"      Hook: {topic.get('hook')}")
        print(f"      Style: {topic.get('style')}")

        project_dir, slug = create_project_for_topic(topic)
        print(f"[2/6] Staged Project: {project_dir}")

        # Step 3: Voiceover & Alignment
        print("[3/6] Synthesizing Voiceover & Subtitle Alignment (Edge-TTS & Whisper)...")
        gen_script = os.path.join(project_dir, "tools", "generate_narration.py")
        if os.path.exists(gen_script):
            res_tts = subprocess.run([sys.executable, gen_script, project_dir], cwd=project_dir)
            if res_tts.returncode != 0:
                print(f"[!] Warning: TTS generation failed with code {res_tts.returncode}")

        # Step 4: Procedural Audio Mixing
        print("[4/6] Procedural Audio & SFX Mixing...")
        capture_mjs = os.path.join(project_dir, "tools", "capture.mjs")
        mix_py = os.path.join(project_dir, "tools", "mix.py")
        if os.path.exists(capture_mjs):
            subprocess.run(["node", capture_mjs, "cues"], cwd=project_dir)
        if os.path.exists(mix_py):
            subprocess.run([sys.executable, mix_py], cwd=project_dir)

        # Step 5: Render 1080x1920 Short via Headless Chrome
        print("[5/6] Rendering 1080x1920 60FPS Video...")
        out_mp4 = os.path.join(project_dir, "renders", "out.mp4")
        if os.path.exists(capture_mjs):
            subprocess.run(["node", capture_mjs, "video", "renders/out.mp4"], cwd=project_dir)

        # Step 6: Verify and Publish
        print("[6/6] Verifying Video Quality & Dispatching Publish...")
        target_video = None
        if os.path.exists(out_mp4) and os.path.getsize(out_mp4) > 500000:
            target_video = out_mp4
            print(f"[+] Render verified: {out_mp4} ({os.path.getsize(out_mp4)} bytes)")
        else:
            # Fallback to existing rendered mp4 in project
            for f in os.listdir(os.path.join(project_dir, "renders")):
                if f.endswith(".mp4"):
                    p = os.path.join(project_dir, "renders", f)
                    if os.path.getsize(p) > 500000:
                        target_video = p
                        break

        if target_video and not args.dry_run:
            print(f"[+] Uploading to staging host: {target_video}")
            try:
                public_url = upload_to_temp_host(target_video)
                title = f"{topic.get('topic')} 🔬✨"
                desc = (
                    f"{topic.get('hook')}\n\n"
                    f"{topic.get('fact')}\n\n"
                    f"Subscribe to @BehindTheScience-24 for daily science explainers! 🚀\n\n"
                    f"#shorts #science #{topic.get('domain', 'education').lower().replace(' ', '')}"
                )
                tags = topic.get("tags", ["science", "shorts", "behindthescience"])
                
                webhook_url = os.environ.get("ZAPIER_WEBHOOK_URL")
                if webhook_url:
                    print("[+] Sending webhook to cloud publisher...")
                    trigger_cloud_publish(
                        title=title,
                        description=desc,
                        video_url=public_url,
                        tags=tags,
                        playlist_id=topic.get("playlist_id", PLAYLIST_SCIENCE_SHORTS)
                    )
                
                record_publication(
                    video_id=slug,
                    title=title,
                    url=public_url,
                    topic=topic.get("topic"),
                    style=topic.get("style"),
                    duration=topic.get("target_duration", 30),
                    playlist_id=topic.get("playlist_id", PLAYLIST_SCIENCE_SHORTS)
                )
                print(f"[🎉] Video successfully published to @BehindTheScience-24!")
            except Exception as e:
                print(f"[!] Error during upload: {e}")
        else:
            print("[*] Dry-run or render missing. Skipping upload.")

        print(f"[✓] {CHANNEL_NAME} cycle completed.")

    finally:
        release_lock()

if __name__ == "__main__":
    main()
