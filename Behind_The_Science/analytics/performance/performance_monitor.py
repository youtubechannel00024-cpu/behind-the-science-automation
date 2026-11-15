"""
Behind The Science - Performance Monitor
Tracks analytics, view counts, likes, and engagement on published videos.
"""
import json
import os
import sys

CHANNEL_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(CHANNEL_ROOT, "config"))
from config import HISTORY_FILE

def update_video_stats(stats_dict):
    """
    stats_dict format:
    {
      "MaDtHo_ug4Y": {"views": 510, "likes": 12, "comments": 2},
      ...
    }
    """
    if not os.path.exists(HISTORY_FILE):
        return

    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    for v in data.get("published_videos", []):
        vid = v.get("id")
        if vid in stats_dict:
            v["stats"] = stats_dict[vid]

    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"[+] Successfully updated stats for {len(stats_dict)} videos.")

if __name__ == "__main__":
    current_stats = {
        "MaDtHo_ug4Y": {"views": 510, "likes": 12, "comments": 2},
        "I5lO2_n_bSI": {"views": 297, "likes": 3, "comments": 0},
        "7PS6A-MckpU": {"views": 6, "likes": 0, "comments": 0},
        "v5rzutkL1_s": {"views": 1, "likes": 1, "comments": 0}
    }
    update_video_stats(current_stats)
