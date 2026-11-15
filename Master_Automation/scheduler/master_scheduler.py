"""
Master Multi-Channel Scheduler Daemon
Discovers all registered channels and manages staggered, non-overlapping automation cycles.
"""
import json
import logging
import os
import subprocess
import sys
import time
from datetime import datetime, timezone

MASTER_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKSPACE_ROOT = os.path.dirname(MASTER_ROOT)
LOG_FILE = os.path.join(MASTER_ROOT, "master_automation.log")

sys.path.insert(0, os.path.join(MASTER_ROOT, "channel_manager"))
from channel_registry import get_registered_channels

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [MASTER-%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)

def run_channel_job(channel_slug, channel_info):
    logging.info(f"--- Triggering production for: {channel_info['name']} ---")
    pipeline = channel_info["pipeline_script"]
    if not os.path.exists(pipeline):
        logging.error(f"Missing pipeline script for {channel_slug}: {pipeline}")
        return

    try:
        res = subprocess.run([sys.executable, pipeline, "--auto"], cwd=channel_info["directory"], capture_output=True, text=True)
        for line in res.stdout.splitlines():
            logging.info(f"  [{channel_slug}] {line}")
        if res.returncode != 0:
            logging.error(f"  [{channel_slug} ERROR] {res.stderr}")
    except Exception as e:
        logging.error(f"Exception running channel {channel_slug}: {e}")

def main():
    logging.info("=================================================================")
    logging.info("MASTER MULTI-CHANNEL YOUTUBE SCHEDULER STARTED")
    logging.info("=================================================================")
    
    channels = get_registered_channels()
    logging.info(f"Discovered {len(channels)} active channel(s): {', '.join(channels.keys())}")

    # Main scheduler loop: checks channels periodically
    while True:
        channels = get_registered_channels()
        for slug, info in channels.items():
            run_channel_job(slug, info)
            # Stagger 30 seconds between channels to avoid GPU/CPU contention
            time.sleep(30)

        # Standard check interval (e.g. 6 hours = 21600s)
        sleep_interval = 6 * 3600
        next_time = datetime.fromtimestamp(time.time() + sleep_interval, tz=timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
        logging.info(f"Master cycle complete. Sleeping for 6 hours. Next master cycle: {next_time}")
        try:
            time.sleep(sleep_interval)
        except KeyboardInterrupt:
            logging.info("Master scheduler stopped by user.")
            break

if __name__ == "__main__":
    main()
