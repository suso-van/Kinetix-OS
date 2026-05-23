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
DEADZONE = 8
FIST_HOLD_DURATION = 2.0
COOLDOWN_DELAY = 0.5

# Margins to map the camera frame to the full screen
FRAME_MARGIN_X = 100
FRAME_MARGIN_Y = 60