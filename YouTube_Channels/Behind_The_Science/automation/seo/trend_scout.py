"""
Behind The Science - Trend Scout & Topic Selector
Selects fresh, high-performing science topics and prevents duplicates.
"""
import json
import os
import sys

# Ensure config is discoverable
CHANNEL_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(CHANNEL_ROOT, "config"))
from config import TOPICS_FILE, HISTORY_FILE

def load_json(filepath, default=None):
    if not os.path.exists(filepath):
        return default if default is not None else []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[!] Error loading {filepath}: {e}")
        return default if default is not None else []

def get_published_ids():
    history = load_json(HISTORY_FILE, default={"published_videos": []})
    published = history.get("published_videos", [])
    used_titles = {v.get("title", "").strip().lower() for v in published}
    used_topics = {v.get("topic", "").strip().lower() for v in published}
    return used_titles, used_topics

def pick_next_topic():
    topics = load_json(TOPICS_FILE, default=[])
    used_titles, used_topics = get_published_ids()

    candidates = []
    for item in topics:
        topic_name = item.get("topic", "").strip().lower()
        if topic_name in used_topics:
            continue
        candidates.append(item)

    if not candidates:
        print("[!] All pre-loaded topics used. Cycling topics.")
        candidates = topics

    candidates.sort(key=lambda x: x.get("priority", 5), reverse=True)
    selected = candidates[0]
    return selected

if __name__ == "__main__":
    chosen = pick_next_topic()
    print(f"[+] Selected Topic: {chosen.get('topic')}")
    print(f"    Domain: {chosen.get('domain')}")
    print(f"    Hook: {chosen.get('hook')}")
    print(f"    Style: {chosen.get('style')}")
