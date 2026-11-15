# 🎛️ Master YouTube Multi-Channel Automation System

A centralized, scalable infrastructure designed to operate **10, 20, or 50+ independent YouTube channels** across different niches from a single unified control center, while maintaining strict isolation of branding, assets, configs, workflows, and analytics.

---

## 🏛️ Scalable Architecture

```text
d:\Youtube\
│
├── YouTube_Channels/                   # Fully isolated channels
│   │
│   ├── Behind_The_Science/             # Channel 1: Science & Space
│   │   ├── branding/                   # Logos, banners, watermarks
│   │   ├── content/                    # Topic database, scripts, research
│   │   ├── videos/                     # Generated, published, failed
│   │   ├── assets/                     # Channel-specific media, audio & fonts
│   │   ├── automation/                 # Channel pipeline & scheduler
│   │   ├── analytics/                  # Stats, views, published history
│   │   ├── config/                     # Channel & SEO settings
│   │   └── logs/                       # Channel execution logs
│   │
│   ├── Tech_Futurism/                  # (Channel 2: Ready to add!)
│   ├── History_Mysteries/              # (Channel 3: Ready to add!)
│   └── ...                             # Unlimited future channels
│
├── Shared_Resources/                   # Reusable global libraries (Zero duplication)
│   ├── common_libraries/               # Three.js, Canvas 2D, timing, captions
│   ├── reusable_templates/             # All 6 video styles (Deep Dive, Night File, etc.)
│   └── common_utilities/               # QA validator, audio mixer, whisper tools
│
└── Master_Automation/                  # Central Command & Control
    ├── channel_manager/                # Channel discovery & registration
    ├── workflow_orchestrator/          # Run single or all channels
    ├── scheduler/                      # Multi-channel staggered daemon
    └── global_config/                  # Global system paths & quotas
```

---

## 🚀 How to Add a New YouTube Channel (In 2 Minutes)

To scale to a new channel (e.g., `Tech_Futurism`):

1. **Create the channel folder:**
   ```powershell
   New-Item -ItemType Directory -Path "d:\Youtube\YouTube_Channels\Tech_Futurism\config\channel_settings" -Force
   ```
2. **Add `channel_config.json`:**
   ```json
   {
     "channel_name": "Tech Futurism",
     "channel_handle": "@techfuturism-ai",
     "channel_id": "UC_NEW_CHANNEL_ID",
     "niche": "AI, Robotics, and Future Technology",
     "default_category_id": "28",
     "privacy_status": "public"
   }
   ```
3. **Verify Registration:**
   ```powershell
   & "d:\Youtube\.faceless-shorts\venv\Scripts\python.exe" "d:\Youtube\Master_Automation\workflow_orchestrator\orchestrator.py" --list
   ```
   *The Master Orchestrator instantly detects and registers the new channel automatically!*

---

## ⚡ Master Control Commands

### 1. List All Active Channels
```powershell
& "d:\Youtube\.faceless-shorts\venv\Scripts\python.exe" "d:\Youtube\Master_Automation\workflow_orchestrator\orchestrator.py" --list
```

### 2. Run a Single Channel On-Demand
```powershell
& "d:\Youtube\.faceless-shorts\venv\Scripts\python.exe" "d:\Youtube\Master_Automation\workflow_orchestrator\orchestrator.py" --channel Behind_The_Science
```

### 3. Run All Registered Channels in Sequence
```powershell
& "d:\Youtube\.faceless-shorts\venv\Scripts\python.exe" "d:\Youtube\Master_Automation\workflow_orchestrator\orchestrator.py" --all
```

### 4. Start 24/7 Master Multi-Channel Daemon
Double-click `run_master.bat` in `Master_Automation/scheduler/`.
