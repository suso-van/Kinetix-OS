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
SCROLL_THRESHOLD = 30       # Increased: Prevents accidental scrolling
SWIPE_THRESHOLD = 60        # Reduced from 80: Makes swipes easier to detect
DEADZONE = 10               # Increased: Kills micro-tremors completely

# Timings & Cooldowns
SCROLL_HOLD_DURATION = 0.08 # Time to hold posture before scroll activates
SCROLL_COOLDOWN = 0.12       # New: Prevents rapid-fire jittery scrolling
CALIBRATION_DURATION = 2.0
PER_GESTURE_COOLDOWN = 1.0
OPEN_PALM_COOLDOWN = 3.0    # New: Prevents continuous spamming of the palm action

# Tracking Region (The visible interaction box)
FRAME_MARGIN_X = 130
FRAME_MARGIN_Y = 80

CURSOR_SPEED_DIVISOR = 400   # controls adaptive smoothing sensitivity
CURSOR_MAX_FACTOR = 0.5      # was hardcoded 0.45 in cursor.py — expose it here