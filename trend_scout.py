"""
Trend Scout & Topic Selector for Behind The Science
Selects fresh, high-performing science topics and prevents duplicates.
"""
import json
import os
import sys

from config import TOPICS_FILE, HISTORY_FILE, PLAYLIST_SCIENCE_SHORTS, PLAYLIST_MYTHBUSTERS

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

    # Filter unpublished candidates
    candidates = []
    for item in topics:
        topic_name = item.get("topic", "").strip().lower()
        if topic_name in used_topics:
            continue
        candidates.append(item)

    if not candidates:
        print("[!] All pre-loaded topics used. Resetting / cycling topics.")
        candidates = topics

    # Sort by priority descending
    candidates.sort(key=lambda x: x.get("priority", 5), reverse=True)
    selected = candidates[0]
    return selected

if __name__ == "__main__":
    chosen = pick_next_topic()
    print(f"[+] Selected Topic: {chosen.get('topic')}")
    print(f"    Domain: {chosen.get('domain')}")
    print(f"    Hook: {chosen.get('hook')}")
    print(f"    Style: {chosen.get('style')}")
