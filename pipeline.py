"""
Root Pipeline Delegator
Delegates to Master_Automation/workflow_orchestrator/orchestrator.py
"""
import os
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ORCHESTRATOR = os.path.join(BASE_DIR, "Master_Automation", "workflow_orchestrator", "orchestrator.py")

if __name__ == "__main__":
    if os.path.exists(ORCHESTRATOR):
        args = sys.argv[1:]
        if "--channel" not in args and "--all" not in args and "--list" not in args:
            args = ["--channel", "Behind_The_Science"] + args
        res = subprocess.run([sys.executable, ORCHESTRATOR] + args)
        sys.exit(res.returncode)
    else:
        print(f"[!] Master Orchestrator not found at {ORCHESTRATOR}")
        sys.exit(1)
