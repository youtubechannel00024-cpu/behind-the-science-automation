"""
GitHub Sync Engine for Behind The Science Automation
Syncs codebase to GitHub via REST API (No local git installation required).
"""
import base64
import json
import os
import sys
import urllib.request
import urllib.error

TOKEN = os.environ.get("GITHUB_TOKEN", "")
OWNER = "youtubechannel00024-cpu"
REPO = "behind-the-science-automation"
BRANCH = "main"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "User-Agent": "BehindTheScience-Sync"
}

def gh_api(endpoint, method="GET", data=None):
    url = f"https://api.github.com{endpoint}" if endpoint.startswith("/") else endpoint
    payload = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=payload, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="ignore")
        print(f"[!] GitHub API Error {e.code} on {method} {endpoint}: {err_msg}")
        raise RuntimeError(f"HTTP {e.code}: {err_msg}")

def check_repo_exists(owner, repo):
    try:
        gh_api(f"/repos/{owner}/{repo}")
        return True
    except RuntimeError:
        return False

def sync_directory_to_github(src_dir, repo_prefix=""):
    print(f"[*] Checking repository: {OWNER}/{REPO}...")
    if not check_repo_exists(OWNER, REPO):
        print(f"[!] Repository {OWNER}/{REPO} does not exist yet or token cannot access it.")
        print(f"    Please create it on GitHub: https://github.com/new (Name: {REPO})")
        return False

    # Collect files to sync
    ignore_names = {"__pycache__", "venv", ".faceless-shorts", "bin", "node_modules", "renders", ".git", "review"}
    files_to_sync = []
    if os.path.isfile(src_dir):
        rel_path = os.path.basename(src_dir)
        if repo_prefix:
            rel_path = f"{repo_prefix}/{rel_path}"
        files_to_sync.append((src_dir, rel_path))
    else:
        for root, dirs, files in os.walk(src_dir):
            # Filter dirs in-place
            dirs[:] = [d for d in dirs if d not in ignore_names]
            for f in files:
                if f.endswith((".mp4", ".wav", ".mp3", ".log", ".lock", ".pyc")):
                    continue
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, src_dir).replace("\\", "/")
                if repo_prefix:
                    rel_path = f"{repo_prefix}/{rel_path}"
                files_to_sync.append((full_path, rel_path))

    if not files_to_sync:
        print("[*] No files to sync. Skipping.")
        return True

    print(f"[+] Found {len(files_to_sync)} files to commit.")

    # 1. Create Blobs for each file
    tree_items = []
    for full_path, rel_path in files_to_sync:
        try:
            with open(full_path, "rb") as fp:
                raw_bytes = fp.read()
            b64_content = base64.b64encode(raw_bytes).decode("ascii")
            blob_res = gh_api(f"/repos/{OWNER}/{REPO}/git/blobs", method="POST", data={
                "content": b64_content,
                "encoding": "base64"
            })
            tree_items.append({
                "path": rel_path,
                "mode": "100644",
                "type": "blob",
                "sha": blob_res["sha"]
            })
            print(f"  -> Uploaded blob: {rel_path}")
        except Exception as e:
            print(f"  [!] Failed to upload {rel_path}: {e}")

    # 2. Get latest commit / base tree on BRANCH if exists
    base_tree_sha = None
    parent_commit_sha = None
    try:
        ref_data = gh_api(f"/repos/{OWNER}/{REPO}/git/ref/heads/{BRANCH}")
        parent_commit_sha = ref_data["object"]["sha"]
        commit_data = gh_api(f"/repos/{OWNER}/{REPO}/git/commits/{parent_commit_sha}")
        base_tree_sha = commit_data["tree"]["sha"]
    except Exception:
        print("[*] No existing commits on branch. Creating initial commit.")

    # 3. Create Tree
    tree_payload = {"tree": tree_items}
    if base_tree_sha:
        tree_payload["base_tree"] = base_tree_sha

    new_tree = gh_api(f"/repos/{OWNER}/{REPO}/git/trees", method="POST", data=tree_payload)
    print(f"[+] Created Tree SHA: {new_tree['sha']}")

    # 4. Create Commit
    commit_payload = {
        "message": "Automated commit: Behind The Science Autonomous Agent Suite",
        "tree": new_tree["sha"]
    }
    if parent_commit_sha:
        commit_payload["parents"] = [parent_commit_sha]

    new_commit = gh_api(f"/repos/{OWNER}/{REPO}/git/commits", method="POST", data=commit_payload)
    print(f"[+] Created Commit SHA: {new_commit['sha']}")

    # 5. Update or Create Ref
    if parent_commit_sha:
        gh_api(f"/repos/{OWNER}/{REPO}/git/refs/heads/{BRANCH}", method="PATCH", data={
            "sha": new_commit["sha"],
            "force": True
        })
    else:
        gh_api(f"/repos/{OWNER}/{REPO}/git/refs", method="POST", data={
            "ref": f"refs/heads/{BRANCH}",
            "sha": new_commit["sha"]
        })

    print(f"\n[🎉] SUCCESS! Pushed to https://github.com/{OWNER}/{REPO}")
    return True

if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else r"d:\Youtube\autonomous_agent"
    prefix = sys.argv[2] if len(sys.argv) > 2 else ""
    sync_directory_to_github(src, repo_prefix=prefix)
