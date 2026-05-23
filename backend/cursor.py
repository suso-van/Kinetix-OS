# cursor.py
import math
import numpy as np
import pyautogui
from collections import deque
from config import CAM_WIDTH, CAM_HEIGHT, SCREEN_WIDTH, SCREEN_HEIGHT, DEADZONE, FRAME_MARGIN_X, FRAME_MARGIN_Y

class CursorManager:
    def __init__(self):
        # Rolling average buffer to remove single-frame noise
        self.landmark_buffer = deque(maxlen=5)
        self.prev_x = 0
        self.prev_y = 0

    def buffered_position(self, x, y):
        self.landmark_buffer.append((x, y))
        avg_x = sum(p[0] for p in self.landmark_buffer) / len(self.landmark_buffer)
        avg_y = sum(p[1] for p in self.landmark_buffer) / len(self.landmark_buffer)
        return avg_x, avg_y

    def adaptive_smooth(self, current_x, current_y):
        distance = math.hypot(current_x - self.prev_x, current_y - self.prev_y)
        # Fast movement = less smoothing, slow/still = more smoothing
        factor = min(0.9, max(0.1, distance / 300))
        smooth_x = self.prev_x + (current_x - self.prev_x) * factor
        smooth_y = self.prev_y + (current_y - self.prev_y) * factor
        return smooth_x, smooth_y

    def move(self, index_x, index_y):
        # 1. Apply rolling average buffer
        buf_x, buf_y = self.buffered_position(index_x, index_y)

        # Map to screen coordinates with margins
        buf_x = np.clip(buf_x, FRAME_MARGIN_X, CAM_WIDTH - FRAME_MARGIN_X)
        buf_y = np.clip(buf_y, FRAME_MARGIN_Y, CAM_HEIGHT - FRAME_MARGIN_Y)

        screen_x = np.interp(buf_x, (FRAME_MARGIN_X, CAM_WIDTH - FRAME_MARGIN_X), (0, SCREEN_WIDTH))
        screen_y = np.interp(buf_y, (FRAME_MARGIN_Y, CAM_HEIGHT - FRAME_MARGIN_Y), (0, SCREEN_HEIGHT))

        # 2. Apply adaptive exponential smoothing
        smooth_x, smooth_y = self.adaptive_smooth(screen_x, screen_y)

        # 3. Apply Deadzone check
        if math.hypot(smooth_x - self.prev_x, smooth_y - self.prev_y) > DEADZONE:
            self.prev_x, self.prev_y = smooth_x, smooth_y
            pyautogui.moveTo(smooth_x, smooth_y)