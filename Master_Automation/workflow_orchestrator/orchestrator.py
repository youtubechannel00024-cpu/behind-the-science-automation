"""
Master Workflow Orchestrator
Executes production workflows across registered YouTube channels.
"""
import argparse
import os
import subprocess
import sys

MASTER_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKSPACE_ROOT = os.path.dirname(MASTER_ROOT)
sys.path.insert(0, os.path.join(MASTER_ROOT, "channel_manager"))
from channel_registry import get_registered_channels, display_registry

def run_channel_pipeline(channel_slug, extra_args=None):
    channels = get_registered_channels()
    if channel_slug not in channels:
        print(f"[!] Error: Channel '{channel_slug}' not found in registry.")
        print(f"    Available channels: {list(channels.keys())}")
        return False

    info = channels[channel_slug]
    pipeline_script = info["pipeline_script"]
    if not os.path.exists(pipeline_script):
        print(f"[!] Error: Pipeline script not found at {pipeline_script}")
        return False

    print(f"\n=======================================================")
    print(f"🚀 Master Orchestrator: Launching '{info['name']}'")
    print(f"=======================================================")
    
    python_exe = sys.executable
    cmd = [python_exe, pipeline_script] + (extra_args or [])
    
    res = subprocess.run(cmd, cwd=info["directory"])
    if res.returncode == 0:
        print(f"[✓] Completed production cycle for '{info['name']}'.")
        return True
    else:
        print(f"[!] Channel '{info['name']}' returned non-zero exit code: {res.returncode}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Master Multi-Channel Video Orchestrator")
    parser.add_argument("--channel", help="Specific channel slug to run (e.g. Behind_The_Science)")
    parser.add_argument("--all", action="store_true", help="Run production cycle across ALL registered channels")
    parser.add_argument("--list", action="store_true", help="List all registered channels")
    args, unknown = parser.parse_known_args()

    if args.list:
        display_registry()
        return

    if args.channel:
        run_channel_pipeline(args.channel, extra_args=unknown)
        return

    if args.all:
        channels = get_registered_channels()
        print(f"[*] Executing batch cycle for {len(channels)} channel(s)...")
        for slug in channels:
            run_channel_pipeline(slug, extra_args=unknown)
        return

    parser.print_help()

if __name__ == "__main__":
    main()
