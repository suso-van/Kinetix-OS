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
