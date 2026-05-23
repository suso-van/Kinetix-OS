# config.py
import pyautogui

# Camera
CAM_WIDTH = 640
CAM_HEIGHT = 480

# Screen
SCREEN_WIDTH, SCREEN_HEIGHT = pyautogui.size()
pyautogui.FAILSAFE = False

# Gestures & Physics (Strict Thresholds)
CLICK_THRESHOLD = 35
SCROLL_THRESHOLD = 20       # Absolute pixel distance needed to trigger a scroll (Symmetrical)
SWIPE_THRESHOLD = 70        # Requires a deliberate sweep to trigger
DEADZONE = 10               # Kills micro-tremors completely

# Timings & Cooldowns
SCROLL_HOLD_DURATION = 0.05
SCROLL_COOLDOWN = 0.05
CALIBRATION_DURATION = 2.0
PER_GESTURE_COOLDOWN = 1.0
OPEN_PALM_COOLDOWN = 3.0

# Tracking Region (The visible interaction box)
FRAME_MARGIN_X = 130
FRAME_MARGIN_Y = 80

CURSOR_SPEED_DIVISOR = 400
CURSOR_MAX_FACTOR = 0.5