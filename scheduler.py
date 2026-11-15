"""
Persistent Autonomous Scheduler for Behind The Science
Manages periodic execution every INTERVAL_HOURS, updates metrics, and ensures zero duplication.
"""
import logging
import os
import subprocess
import sys
import time
from datetime import datetime, timezone

from config import AGENT_ROOT, INTERVAL_HOURS, LOG_FILE, LOCK_FILE, PYTHON_VENV

# Configure logging to both file and stdout
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)

def run_job():
    logging.info("==================================================")
    logging.info("Starting Autonomous Production Cycle")
    logging.info("==================================================")

    pipeline_script = os.path.join(AGENT_ROOT, "pipeline.py")
    perf_script = os.path.join(AGENT_ROOT, "performance_monitor.py")

    # Step 1: Run performance analysis
    try:
        logging.info("Refreshing channel performance metrics...")
        subprocess.run([PYTHON_VENV, perf_script], check=True, capture_output=True, text=True)
        logging.info("Performance stats updated successfully.")
    except Exception as e:
        logging.warning(f"Performance monitor warning: {e}")

    # Step 2: Run pipeline
    try:
        logging.info("Executing video production pipeline...")
        res = subprocess.run([PYTHON_VENV, pipeline_script], check=True, capture_output=True, text=True)
        logging.info("Pipeline completed successfully:")
        for line in res.stdout.splitlines():
            logging.info(f"  {line}")
    except subprocess.CalledProcessError as e:
        logging.error(f"Pipeline error (code {e.returncode}):\n{e.stderr}\n{e.stdout}")
    except Exception as e:
        logging.error(f"Unexpected pipeline exception: {e}")

def main():
    logging.info("=== Behind The Science Autonomous Agent Service Started ===")
    logging.info(f"Schedule Interval: Every {INTERVAL_HOURS} hours (4 high-impact videos/day)")
    logging.info(f"Log Destination: {LOG_FILE}")

    # Check when the last video was published to prevent premature upload
    sleep_seconds = INTERVAL_HOURS * 3600
    try:
        from trend_scout import load_json
        from config import HISTORY_FILE
        hist = load_json(HISTORY_FILE, default={"published_videos": []})
        vids = hist.get("published_videos", [])
        if vids:
            last_pub_str = vids[-1].get("published_at", "")
            # If ISO string
            if "T" in last_pub_str:
                from datetime import datetime
                last_dt = datetime.fromisoformat(last_pub_str.replace("Z", "+00:00"))
                elapsed = (datetime.now(timezone.utc) - last_dt).total_seconds()
                if elapsed < sleep_seconds:
                    rem = int(sleep_seconds - elapsed)
                    logging.info(f"Last video published {int(elapsed/60)} mins ago. Sleeping {int(rem/60)} mins until next slot.")
                    time.sleep(rem)
    except Exception as e:
        logging.warning(f"Could not compute last upload interval: {e}")

    # Run first scheduled cycle
    if not os.path.exists(LOCK_FILE):
        run_job()

    sleep_seconds = INTERVAL_HOURS * 3600

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
    main()
