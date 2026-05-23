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
    self.landmark_buffer = deque(maxlen=8)  # Increased buffer for smoother tracking
    self.prev_x = 0
    self.prev_y = 0
    self.velocity_x = 0
    self.velocity_y = 0
    self.last_move_time = 0

  def buffered_position(self, x, y):
    self.landmark_buffer.append((x, y))
    # Gaussian-like weighted average - more weight to recent frames
    if len(self.landmark_buffer) < 3:
      return x, y

    weights = [0.1, 0.15, 0.2, 0.25, 0.3]  # Progressive weights
    weights = weights[:len(self.landmark_buffer)]
    total = sum(weights)
    avg_x = sum(w * p[0] for w, p in zip(weights, self.landmark_buffer)) / total
    avg_y = sum(w * p[1] for w, p in zip(weights, self.landmark_buffer)) / total
    return avg_x, avg_y

  def adaptive_smooth(self, current_x, current_y):
    # Calculate movement distance
    distance = math.hypot(current_x - self.prev_x, current_y - self.prev_y)

    # Dynamic factor based on movement speed
    # Slower movements = more smoothing, faster movements = less smoothing
    if distance < 5:
      factor = 0.3  # Heavy smoothing for micro-movements
    elif distance < 15:
      factor = 0.5  # Medium smoothing
    else:
      factor = min(CURSOR_MAX_FACTOR, max(0.15, distance / CURSOR_SPEED_DIVISOR))

    # Exponential moving average for even smoother transitions
    smooth_x = self.prev_x + (current_x - self.prev_x) * factor
    smooth_y = self.prev_y + (current_y - self.prev_y) * factor

    return smooth_x, smooth_y

  def move(self, index_x, index_y):
    # Apply temporal buffering
    buf_x, buf_y = self.buffered_position(index_x, index_y)

    # Clip to tracking region
    buf_x = np.clip(buf_x, FRAME_MARGIN_X, CAM_WIDTH - FRAME_MARGIN_X)
    buf_y = np.clip(buf_y, FRAME_MARGIN_Y, CAM_HEIGHT - FRAME_MARGIN_Y)

    # Map to screen coordinates
    screen_x = np.interp(buf_x, (FRAME_MARGIN_X, CAM_WIDTH - FRAME_MARGIN_X), (0, SCREEN_WIDTH))
    screen_y = np.interp(buf_y, (FRAME_MARGIN_Y, CAM_HEIGHT - FRAME_MARGIN_Y), (0, SCREEN_HEIGHT))

    # Apply adaptive smoothing
    smooth_x, smooth_y = self.adaptive_smooth(screen_x, screen_y)

    # Only move if beyond deadzone
    if math.hypot(smooth_x - self.prev_x, smooth_y - self.prev_y) > DEADZONE:
      self.prev_x, self.prev_y = smooth_x, smooth_y
      pyautogui.moveTo(smooth_x, smooth_y, _pause=False, duration=0.01)  # Added tiny duration for smoothness