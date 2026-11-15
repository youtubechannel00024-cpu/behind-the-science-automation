"""
Run Now - Immediate Trigger for Behind The Science Autonomous Production Cycle
"""
import subprocess
import sys
import os
from config import PYTHON_VENV, AGENT_ROOT

def main():
    print("[*] Triggering Immediate Autonomous Production Cycle...")
    pipeline_path = os.path.join(AGENT_ROOT, "pipeline.py")
    res = subprocess.run([PYTHON_VENV, pipeline_path] + sys.argv[1:])
    sys.exit(res.returncode)

if __name__ == "__main__":
    main()
