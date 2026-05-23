# Kinetix-OS
Kinetix-OS is a hand-gesture control prototype for browser and media workflows.
It uses webcam-based hand tracking (MediaPipe) to move the cursor, click, scroll, switch tabs/apps, and trigger quick actions.

## What it does
- Tracks one hand in real time using a local MediaPipe hand landmark model (`backend/hand_landmarker.task`)
- Supports:
  - Cursor movement (index-finger navigation posture)
  - Pinch-to-click
  - Scroll via two-finger posture
  - Two-finger swipe for tab switching
  - Whole-hand swipe for app switching
  - Finger-combo shortcuts (open YouTube / GitHub by default)
- Routes detected gestures to configurable actions through `backend/mappings.json`

## Project structure
- `backend/main.py` — app entrypoint, camera loop, gesture detection + UI overlay
- `backend/gestures.py` — gesture classification and swipe/scroll logic
- `backend/cursor.py` — cursor smoothing and movement mapping
- `backend/workflow_router.py` — cooldowns + action execution layer
- `backend/config.py` — camera, thresholds, timing, smoothing constants
- `backend/mappings.json` — gesture-to-action mapping by mode
- `backend/hand_landmarker.task` — MediaPipe model file (required)
- `kinetix_mvp_dashboard.html` — dashboard artifact

## Prerequisites
- Python 3.10+ recommended
- macOS/Windows with webcam access
- Accessibility/Input permissions granted to Terminal/Python app (required for mouse/keyboard automation)

## Installation
From the project root:

```bash path=null start=null
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install opencv-python mediapipe pyautogui numpy keyboard
```

## Run
The app expects to be run from `backend/` so relative files resolve correctly:

```bash path=null start=null
cd backend
python3 main.py
```

Press `Esc` in the camera window to quit.

## Gesture mappings
Current default mappings are in `backend/mappings.json` under the `BROWSER` and `MEDIA` modes.
Examples:
- `PINCH_CLICK` → mouse click
- `SCROLL_UP` / `SCROLL_DOWN` → scroll
- `SWIPE_LEFT` / `SWIPE_RIGHT` → previous/next tab
- `WHOLE_HAND_SWIPE_LEFT` / `WHOLE_HAND_SWIPE_RIGHT` → app switching
- `INDEX_PINKY` / `INDEX_RING` → open YouTube/GitHub

## Configuration
Tune behavior in `backend/config.py`:
- Camera resolution (`CAM_WIDTH`, `CAM_HEIGHT`)
- Gesture thresholds (`CLICK_THRESHOLD`, `SCROLL_THRESHOLD`, `SWIPE_THRESHOLD`)
- Timing/cooldowns (`SCROLL_HOLD_DURATION`, `PER_GESTURE_COOLDOWN`, etc.)
- Cursor smoothing and deadzone constants

## Notes
- `backend/hand_landmarker.task` must exist before startup.
- Some key bindings in `workflow_router.py` are OS-sensitive; adjust them if your platform layout differs.
# ⚡ KINETIX

**A Zero-Touch, Intent-Driven Spatial Computing Interface.**

[![Status](https://img.shields.io/badge/Status-Active_Development-10B981?style=for-the-badge)]()
[![Ecosystem](https://img.shields.io/badge/Architecture-Unified_Monorepo-20B2AA?style=for-the-badge)]()
[![AI](https://img.shields.io/badge/AI_Engine-VLM_Orchestration-7FFFD4?style=for-the-badge)]()

Kinetix breaks artificial intelligence out of the text box and gives it a physical presence in the real world. By translating raw human physical movement into digital action, Kinetix removes the barrier of traditional peripherals (mice, keyboards) and creates a hands-free, context-aware automation pipeline.

This project is a core module within a broader unified monorepo ecosystem, engineered to bridge the gap between low-level system tracking (hardware/OS manipulation) and high-level AI/GenAI (vision-language reasoning).

---

## 🎯 The Vision

Right now, humans must translate their intentions into keystrokes. Kinetix reverses this paradigm. Whether it is a surgeon in a sterile operating room needing to scroll through X-rays, an industrial worker with grease-covered hands reviewing schematics, or a user with motor impairments navigating the web—Kinetix makes the computer understand *you*.

## ✨ Core Features

* **Real-Time Spatial Perception:** Utilizes edge-based computer vision (MediaPipe) to instantly map skeletal joints of the hands, face, or body through any standard webcam.
* **Dynamic Gesture Mapping (Modes):** A highly fluid Next.js frontend that allows users to instantly remap physical gestures to digital actions via context bundles (e.g., *Browser Mode*, *Media Mode*, *Doctor Mode*, *Terminal Mode*).
* **VLM Orchestration Engine:** Integrates Vision-Language Models (VLMs) to understand screen context. Point at a paragraph and trigger a gesture, and the AI agent will read the screen coordinates and execute complex workflows (like summarizing text).
* **Zero-Latency Execution:** A deterministic Python/FastAPI backend calculates physical vectors (velocity, pinch distance) and fires system-level execution commands (via `pyautogui`, `pymouse`, etc.) via WebSockets.

---

## 🏗️ Architecture Pipeline

The system operates on a continuous loop of Perception, Reasoning, and Execution:

1.  **👁️ Perception (The Eyes):** OpenCV + MediaPipe captures physical movement.
2.  **⚙️ Math Engine (The Backend):** Python calculates the physics of the movement (velocity for swipes, distance for pinches, vectors for pointing).
3.  **🧠 Orchestrator (The Brain):** LangChain + VLM (GPT-4o/Claude) interprets complex visual queries based on screen context.
4.  **🦾 Execution (The Hands):** System-level scripts automatically move the cursor, scroll pages, or type text.

---

## 💻 Technology Stack

* **Frontend Interface:** Next.js, React, Tailwind CSS, Framer Motion *(Bioluminescent / Hacker-Architect aesthetic)*
* **Backend API & WebSockets:** Python, FastAPI, Uvicorn
* **Computer Vision:** OpenCV, Google MediaPipe
* **System Automation:** PyAutoGUI, keyboard

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* Python (3.10+)
* Standard Webcam

### Installation (Monorepo Setup)

**1. Clone the repository:**
```bash
git clone [https://github.com/susovanchatterjee/kinetix.git](https://github.com/susovanchatterjee/kinetix.git)
cd kinetix
```
