"""
Publisher module for Behind The Science
Stages video files to public hosting and prepares YouTube publishing payloads.
"""
import json
import os
import subprocess
import urllib.request
from config import HISTORY_FILE, DEFAULT_CATEGORY_ID, PRIVACY_STATUS

def upload_to_temp_host(file_path):
    """Uploads video to uguu.se for Zapier YouTube ingest"""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Video file not found: {file_path}")

    # Use curl to upload multipart file to uguu.se
    cmd = ["curl", "-s", "-F", f"files[]=@{file_path}", "https://uguu.se/upload"]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(res.stdout)
        if data.get("success") and data.get("files"):
            url = data["files"][0]["url"]
            print(f"[+] Uploaded video to temporary host: {url}")
            return url
        else:
            raise RuntimeError(f"Unexpected response from uguu.se: {res.stdout}")
    except Exception as e:
        print(f"[!] Staging upload failed: {e}")
        raise

def trigger_cloud_publish(title, description, video_url, tags, playlist_id):
    """Sends payload to Zapier webhook for cloud execution if configured"""
    webhook_url = os.environ.get("ZAPIER_WEBHOOK_URL")
    if not webhook_url:
        print("[!] No ZAPIER_WEBHOOK_URL found in environment. Skipping webhook push.")
        return False

    payload = {
        "title": title,
        "description": description,
        "video_url": video_url,
        "tags": tags,
        "playlist_id": playlist_id
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        webhook_url,
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": "BTS-Publisher"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"[+] Successfully triggered Zapier Webhook! (HTTP {resp.status})")
            return True
    except Exception as e:
        print(f"[!] Zapier webhook trigger failed: {e}")
        return False

def record_publication(video_id, title, url, topic, style, duration, playlist_id):
    """Records published video to published_history.json"""
    history = {"published_videos": []}
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            history = json.load(f)

    from datetime import datetime, timezone
    now_iso = datetime.now(timezone.utc).isoformat()

    new_entry = {
        "id": video_id,
        "title": title,
        "url": url,
        "topic": topic,
        "style": style,
        "duration": duration,
        "playlist_id": playlist_id,
        "published_at": now_iso,
        "status": "published",
        "stats": {"views": "0", "likes": "0", "comments": "0"}
    }
    history.setdefault("published_videos", []).append(new_entry)

    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)
    print(f"[+] Successfully logged video {video_id} to {HISTORY_FILE}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        f = sys.argv[1]
        url = upload_to_temp_host(f)
        print(f"URL: {url}")
