"""
Behind The Science - Channel Scheduler Daemon
Periodically triggers channel production cycle every INTERVAL_HOURS.
"""
import logging
import os
import subprocess
import sys
import time
from datetime import datetime, timezone

CHANNEL_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(CHANNEL_ROOT, "config"))
from config import CHANNEL_NAME, INTERVAL_HOURS, LOG_FILE, LOCK_FILE, PYTHON_VENV, HISTORY_FILE

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)

def run_job():
    logging.info(f"=== Starting Production Cycle for {CHANNEL_NAME} ===")
    pipeline_script = os.path.join(CHANNEL_ROOT, "automation", "video_generation", "pipeline.py")
    perf_script = os.path.join(CHANNEL_ROOT, "analytics", "performance", "performance_monitor.py")

    try:
        subprocess.run([PYTHON_VENV, perf_script], check=True, capture_output=True, text=True)
    except Exception as e:
        logging.warning(f"Performance monitor warning: {e}")

    try:
        res = subprocess.run([PYTHON_VENV, pipeline_script], check=True, capture_output=True, text=True)
        for line in res.stdout.splitlines():
            logging.info(f"  {line}")
    except subprocess.CalledProcessError as e:
        logging.error(f"Pipeline error (code {e.returncode}):\n{e.stderr}\n{e.stdout}")
    except Exception as e:
        logging.error(f"Unexpected pipeline exception: {e}")

def main():
    logging.info(f"=== {CHANNEL_NAME} Autonomous Scheduler Started ===")
    logging.info(f"Schedule Interval: Every {INTERVAL_HOURS} hours")
    logging.info(f"Log Destination: {LOG_FILE}")

    sleep_seconds = INTERVAL_HOURS * 3600
    try:
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                hist = json.load(f)
            vids = hist.get("published_videos", [])
            if vids:
                last_pub_str = vids[-1].get("published_at", "")
                if "T" in last_pub_str:
                    last_dt = datetime.fromisoformat(last_pub_str.replace("Z", "+00:00"))
                    elapsed = (datetime.now(timezone.utc) - last_dt).total_seconds()
                    if elapsed < sleep_seconds:
                        rem = int(sleep_seconds - elapsed)
                        logging.info(f"Last video published {int(elapsed/60)} mins ago. Sleeping {int(rem/60)} mins until next slot.")
                        time.sleep(rem)
    except Exception as e:
        logging.warning(f"Could not compute last upload interval: {e}")

    if not os.path.exists(LOCK_FILE):
        run_job()

    while True:
        next_run = datetime.fromtimestamp(time.time() + sleep_seconds, tz=timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
        logging.info(f"Sleeping for {INTERVAL_HOURS} hours. Next cycle at: {next_run}")
        try:
            time.sleep(sleep_seconds)
            run_job()
        except KeyboardInterrupt:
            logging.info("Scheduler interrupted by user. Exiting cleanly.")
            break
        except Exception as e:
            logging.error(f"Scheduler loop error: {e}. Retrying in 5 minutes...")
            time.sleep(300)

if __name__ == "__main__":
    import json
    main()
