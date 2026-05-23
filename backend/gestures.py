# gestures.py
import math
from config import CLICK_THRESHOLD, SCROLL_THRESHOLD

# State for scrolling
prev_scroll_y = 0

def detect_pinch(thumb, index):
    return math.hypot(thumb[0] - index[0], thumb[1] - index[1]) < CLICK_THRESHOLD

def get_scroll_direction(index_y):
    global prev_scroll_y
    diff = index_y - prev_scroll_y
    prev_scroll_y = index_y
    if abs(diff) > SCROLL_THRESHOLD:
        return "SCROLL_DOWN" if diff > 0 else "SCROLL_UP"
    return None

def detect_open_palm(pixel_landmarks):
    tips = [8, 12, 16, 20]
    pips = [6, 10, 14, 18]
    open_count = sum(1 for tip, pip in zip(tips, pips) if pixel_landmarks[tip][1] < pixel_landmarks[pip][1])
    return open_count >= 4

def detect_fist(pixel_landmarks):
    tips = [8, 12, 16, 20]
    mcps = [5, 9, 13, 17]
    closed_count = sum(1 for tip, mcp in zip(tips, mcps) if pixel_landmarks[tip][1] > pixel_landmarks[mcp][1])
    return closed_count >= 4