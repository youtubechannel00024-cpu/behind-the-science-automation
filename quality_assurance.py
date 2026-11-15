"""
Automatic Quality Assurance module for Behind The Science
Validates video file parameters, audio tracks, duration, and SEO metadata.
"""
import json
import os
import subprocess
from config import FFMPEG, FFPROBE, MAX_DURATION_SECONDS, MIN_DURATION_SECONDS

def verify_video(video_path):
    report = {
        "passed": False,
        "errors": [],
        "warnings": [],
        "metadata": {}
    }

    if not os.path.exists(video_path):
        report["errors"].append(f"File not found: {video_path}")
        return report

    file_size_mb = os.path.getsize(video_path) / (1024 * 1024)
    report["metadata"]["file_size_mb"] = round(file_size_mb, 2)
    if file_size_mb < 0.5:
        report["errors"].append(f"File size too small ({file_size_mb:.2f} MB), render likely aborted.")
        return report

    # Run ffprobe to get stream properties
    cmd = [
        FFPROBE, "-v", "error",
        "-show_entries", "format=duration:stream=width,height,codec_type,codec_name",
        "-of", "json",
        video_path
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        probe_data = json.loads(res.stdout)
    except Exception as e:
        report["errors"].append(f"ffprobe failed: {e}")
        return report

    # Check duration
    duration = float(probe_data.get("format", {}).get("duration", 0.0))
    report["metadata"]["duration"] = round(duration, 3)

    if duration < MIN_DURATION_SECONDS:
        report["errors"].append(f"Duration too short ({duration:.2f}s < {MIN_DURATION_SECONDS}s)")
    elif duration > MAX_DURATION_SECONDS:
        report["errors"].append(f"Duration too long for Shorts ({duration:.2f}s > {MAX_DURATION_SECONDS}s)")

    # Check streams
    streams = probe_data.get("streams", [])
    has_video = False
    has_audio = False
    width = 0
    height = 0

    for s in streams:
        if s.get("codec_type") == "video":
            has_video = True
            width = s.get("width", 0)
            height = s.get("height", 0)
        elif s.get("codec_type") == "audio":
            has_audio = True

    report["metadata"]["resolution"] = f"{width}x{height}"
    report["metadata"]["has_video"] = has_video
    report["metadata"]["has_audio"] = has_audio

    if not has_video:
        report["errors"].append("Missing video stream.")
    if not has_audio:
        report["errors"].append("Missing audio stream.")

    if width != 1080 or height != 1920:
        report["warnings"].append(f"Resolution is {width}x{height}, expected 1080x1920 (9:16).")

    if not report["errors"]:
        report["passed"] = True

    return report

def verify_metadata(title, description, tags, hashtags):
    errors = []
    if not title or len(title) > 100:
        errors.append(f"Invalid title length ({len(title) if title else 0}). Must be 1-100 characters.")
    if not description or len(description) < 20:
        errors.append("Description is too short or missing.")
    if not tags or len(tags) < 2:
        errors.append("Too few tags provided.")
    if not hashtags or len(hashtags) < 2:
        errors.append("Too few hashtags provided.")

    return {
        "passed": len(errors) == 0,
        "errors": errors
    }

if __name__ == "__main__":
    import sys
    test_path = sys.argv[1] if len(sys.argv) > 1 else r"d:\Youtube\Youtube Videos\cracking-knuckles\renders\video.mp4"
    res = verify_video(test_path)
    print(json.dumps(res, indent=2))
