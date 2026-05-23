# cursor.py
import math
import numpy as np
import pyautogui
from collections import deque
from config import (CAM_WIDTH, CAM_HEIGHT, SCREEN_WIDTH, SCREEN_HEIGHT,
                    DEADZONE, FRAME_MARGIN_X, FRAME_MARGIN_Y,
                    CURSOR_SPEED_DIVISOR, CURSOR_MAX_FACTOR)

class CursorManager:
    def __init__(self):
        self.landmark_buffer = deque(maxlen=5)
        self.prev_x = 0
        self.prev_y = 0
        self.velocity_x = 0
        self.velocity_y = 0

    def buffered_position(self, x, y):
        self.landmark_buffer.append((x, y))
        # Weighted average — recent frames count more than old ones
        weights = list(range(1, len(self.landmark_buffer) + 1))
        total = sum(weights)
        avg_x = sum(w * p[0] for w, p in zip(weights, self.landmark_buffer)) / total
        avg_y = sum(w * p[1] for w, p in zip(weights, self.landmark_buffer)) / total
        return avg_x, avg_y

    def adaptive_smooth(self, current_x, current_y):
        distance = math.hypot(current_x - self.prev_x, current_y - self.prev_y)
        factor = min(CURSOR_MAX_FACTOR, max(0.08, distance / CURSOR_SPEED_DIVISOR))
        smooth_x = self.prev_x + (current_x - self.prev_x) * factor
        smooth_y = self.prev_y + (current_y - self.prev_y) * factor
        return smooth_x, smooth_y

    def move(self, index_x, index_y):
        buf_x, buf_y = self.buffered_position(index_x, index_y)

        buf_x = np.clip(buf_x, FRAME_MARGIN_X, CAM_WIDTH - FRAME_MARGIN_X)
        buf_y = np.clip(buf_y, FRAME_MARGIN_Y, CAM_HEIGHT - FRAME_MARGIN_Y)

        screen_x = np.interp(buf_x, (FRAME_MARGIN_X, CAM_WIDTH - FRAME_MARGIN_X), (0, SCREEN_WIDTH))
        screen_y = np.interp(buf_y, (FRAME_MARGIN_Y, CAM_HEIGHT - FRAME_MARGIN_Y), (0, SCREEN_HEIGHT))

        smooth_x, smooth_y = self.adaptive_smooth(screen_x, screen_y)

        if math.hypot(smooth_x - self.prev_x, smooth_y - self.prev_y) > DEADZONE:
            self.prev_x, self.prev_y = smooth_x, smooth_y
            pyautogui.moveTo(smooth_x, smooth_y, _pause=False)  # _pause=False removes pyautogui's built-in 0.1s delay