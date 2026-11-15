"""
Master Channel Registry
Scans YouTube_Channels/ directory, registers channels, and validates their configurations.
"""
import json
import os
import sys

MASTER_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKSPACE_ROOT = os.path.dirname(MASTER_ROOT)
CHANNELS_ROOT = os.path.join(WORKSPACE_ROOT, "YouTube_Channels")

def get_registered_channels():
    """Scans and returns all registered channel directories and configurations"""
    channels = {}
    if not os.path.exists(CHANNELS_ROOT):
        return channels

    for entry in os.listdir(CHANNELS_ROOT):
        channel_dir = os.path.join(CHANNELS_ROOT, entry)
        if not os.path.isdir(channel_dir):
            continue

        config_path = os.path.join(channel_dir, "config", "channel_settings", "channel_config.json")
        if os.path.exists(config_path):
            try:
                with open(config_path, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                channels[entry] = {
                    "slug": entry,
                    "name": cfg.get("channel_name", entry),
                    "handle": cfg.get("channel_handle", ""),
                    "id": cfg.get("channel_id", ""),
                    "niche": cfg.get("niche", "General"),
                    "directory": channel_dir,
                    "pipeline_script": os.path.join(channel_dir, "automation", "video_generation", "pipeline.py"),
                    "scheduler_script": os.path.join(channel_dir, "automation", "scheduling", "scheduler.py"),
                    "history_file": os.path.join(channel_dir, "analytics", "published_history.json")
                }
            except Exception as e:
                print(f"[!] Error loading channel config for {entry}: {e}")
    return channels

def display_registry():
    channels = get_registered_channels()
    print("=" * 65)
    print(f"MASTER YOUTUBE AUTOMATION REGISTRY · {len(channels)} Channel(s) Active")
    print("=" * 65)
    for slug, info in channels.items():
        print(f"[{slug}]")
        print(f"  Name:   {info['name']} ({info['handle']})")
        print(f"  Niche:  {info['niche']}")
        print(f"  ID:     {info['id']}")
        print(f"  Path:   {info['directory']}")
        print("-" * 65)

if __name__ == "__main__":
    display_registry()
