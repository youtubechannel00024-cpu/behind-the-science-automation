"""
Behind The Science - Immediate Run Trigger
"""
import os
import subprocess
import sys

CHANNEL_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(CHANNEL_ROOT, "config"))
from config import PYTHON_VENV

def main():
    print("[*] Triggering Immediate Cycle for Behind The Science...")
    pipeline_path = os.path.join(CHANNEL_ROOT, "automation", "video_generation", "pipeline.py")
    res = subprocess.run([PYTHON_VENV, pipeline_path] + sys.argv[1:])
    sys.exit(res.returncode)

if __name__ == "__main__":
    main()
