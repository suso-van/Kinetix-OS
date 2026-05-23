# config.py
import pyautogui

# Camera
CAM_WIDTH = 640
CAM_HEIGHT = 480

# Screen
SCREEN_WIDTH, SCREEN_HEIGHT = pyautogui.size()
pyautogui.FAILSAFE = False

# Gestures & Physics
CLICK_THRESHOLD = 35
SCROLL_THRESHOLD = 25
SWIPE_THRESHOLD = 100      # Minimum horizontal movement for a swipe
DEADZONE = 8
FIST_HOLD_DURATION = 2.0
SCROLL_HOLD_DURATION = 0.15 # 150ms hold to activate scroll
CALIBRATION_DURATION = 2.0  # Startup delay for stability
PER_GESTURE_COOLDOWN = 1.0  # Prevent double-triggering

# Margins to map the camera frame to the full screen
FRAME_MARGIN_X = 100
FRAME_MARGIN_Y = 60