# kinetix_core.py
import cv2 as cv
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
import pyautogui
import keyboard
import webbrowser
import math
import time
from collections import deque

CAM_WIDTH, CAM_HEIGHT = 640, 480
CLICK_THRESHOLD = 35
SCROLL_THRESHOLD = 25
DEADZONE = 8
FIST_HOLD_DURATION = 2.0

SCREEN_WIDTH, SCREEN_HEIGHT = pyautogui.size()
pyautogui.FAILSAFE = False

base_options = python.BaseOptions(model_asset_path='hand_landmarker.task')
options = vision.HandLandmarkerOptions(
  base_options=base_options,
  num_hands=1,
  min_hand_detection_confidence=0.7,
  min_hand_presence_confidence=0.7,
  min_tracking_confidence=0.7
)
detector = vision.HandLandmarker.create_from_options(options)

HAND_CONNECTIONS = [
  (0, 1), (1, 2), (2, 3), (3, 4),  # Thumb
  (0, 5), (5, 6), (6, 7), (7, 8),  # Index
  (5, 9), (9, 10), (10, 11), (11, 12),  # Middle
  (9, 13), (13, 14), (14, 15), (15, 16),  # Ring
  (13, 17), (17, 18), (18, 19), (19, 20),  # Pinky
  (0, 17)  # Palm base
]


def draw_hand(image, pixel_landmarks):
  # Draw lines
  for connection in HAND_CONNECTIONS:
    start_idx, end_idx = connection
    cv.line(image, pixel_landmarks[start_idx], pixel_landmarks[end_idx], (0, 255, 0), 2)
  # Draw joints
  for point in pixel_landmarks:
    cv.circle(image, point, 4, (0, 0, 255), -1)


landmark_buffer = deque(maxlen=5)
prev_x, prev_y = 0, 0
prev_scroll_y = 0
fist_start_time = None
current_mode = "BROWSER"

ACTION_MAP = {
  "BROWSER": {
    "PINCH_CLICK": lambda: pyautogui.click(),
    "SCROLL_UP": lambda: pyautogui.scroll(80),
    "SCROLL_DOWN": lambda: pyautogui.scroll(-80),
    "OPEN_PALM": lambda: webbrowser.open("https://youtube.com"),
    "SWIPE_LEFT": lambda: keyboard.press_and_release("alt+left"),
    "SWIPE_RIGHT": lambda: keyboard.press_and_release("alt+right"),
  },
  "MEDIA": {
    "PINCH_CLICK": lambda: keyboard.press_and_release("playpause"),
    "SCROLL_UP": lambda: keyboard.press_and_release("volumeup"),
    "SCROLL_DOWN": lambda: keyboard.press_and_release("volumedown"),
    "OPEN_PALM": lambda: keyboard.press_and_release("nexttrack"),
    "SWIPE_LEFT": lambda: keyboard.press_and_release("prevtrack"),
    "SWIPE_RIGHT": lambda: keyboard.press_and_release("nexttrack"),
  },
  "DOCTOR": {
    "PINCH_CLICK": lambda: pyautogui.click(),
    "SCROLL_UP": lambda: pyautogui.scroll(40),
    "SCROLL_DOWN": lambda: pyautogui.scroll(-40),
    "OPEN_PALM": lambda: pyautogui.hotkey("ctrl", "z"),
    "SWIPE_LEFT": lambda: pyautogui.hotkey("ctrl", "shift", "tab"),
    "SWIPE_RIGHT": lambda: pyautogui.hotkey("ctrl", "tab"),
  },
}
MODES = list(ACTION_MAP.keys())


def execute_action(gesture_name):
  action = ACTION_MAP.get(current_mode, {}).get(gesture_name)
  if action:
    action()
    print(f"[{current_mode}] Executed: {gesture_name}")


def buffered_position(x, y):
  landmark_buffer.append((x, y))
  avg_x = sum(p[0] for p in landmark_buffer) / len(landmark_buffer)
  avg_y = sum(p[1] for p in landmark_buffer) / len(landmark_buffer)
  return avg_x, avg_y


def adaptive_smooth(current_x, current_y, px, py):
  distance = math.hypot(current_x - px, current_y - py)
  factor = min(0.9, max(0.1, distance / 300))
  smooth_x = px + (current_x - px) * factor
  smooth_y = py + (current_y - py) * factor
  return smooth_x, smooth_y


def move_cursor(index_x, index_y):
  global prev_x, prev_y

  frame_margin_x, frame_margin_y = 100, 60
  buf_x, buf_y = buffered_position(index_x, index_y)

  buf_x = np.clip(buf_x, frame_margin_x, CAM_WIDTH - frame_margin_x)
  buf_y = np.clip(buf_y, frame_margin_y, CAM_HEIGHT - frame_margin_y)

  screen_x = np.interp(buf_x, (frame_margin_x, CAM_WIDTH - frame_margin_x), (0, SCREEN_WIDTH))
  screen_y = np.interp(buf_y, (frame_margin_y, CAM_HEIGHT - frame_margin_y), (0, SCREEN_HEIGHT))

  smooth_x, smooth_y = adaptive_smooth(screen_x, screen_y, prev_x, prev_y)

  if math.hypot(smooth_x - prev_x, smooth_y - prev_y) > DEADZONE:
    prev_x, prev_y = smooth_x, smooth_y
    pyautogui.moveTo(smooth_x, smooth_y)

def detect_pinch(thumb, index):
  return math.hypot(thumb[0] - index[0], thumb[1] - index[1]) < CLICK_THRESHOLD


def get_scroll_direction(index_y):
  global prev_scroll_y
  diff = index_y - prev_scroll_y
  prev_scroll_y = index_y
  if abs(diff) > SCROLL_THRESHOLD:
    return "SCROLL_DOWN" if diff > 0 else "SCROLL_UP"
  return None


def detect_open_palm(landmarks):
  tips = [8, 12, 16, 20]
  pips = [6, 10, 14, 18]
  open_count = sum(1 for tip, pip in zip(tips, pips) if landmarks[tip][1] < landmarks[pip][1])
  return open_count >= 4


def detect_fist(landmarks):
  tips = [8, 12, 16, 20]
  mcps = [5, 9, 13, 17]
  closed_count = sum(1 for tip, mcp in zip(tips, mcps) if landmarks[tip][1] > landmarks[mcp][1])
  return closed_count >= 4


def handle_mode_switch(landmarks):
  global current_mode, fist_start_time
  if detect_fist(landmarks):
    if fist_start_time is None:
      fist_start_time = time.time()
    elif time.time() - fist_start_time >= FIST_HOLD_DURATION:
      idx = (MODES.index(current_mode) + 1) % len(MODES)
      current_mode = MODES[idx]
      print(f"MODE SWAPPED → {current_mode}")
      fist_start_time = None
  else:
    fist_start_time = None


cap = cv.VideoCapture(0)
cap.set(cv.CAP_PROP_FRAME_WIDTH, CAM_WIDTH)
cap.set(cv.CAP_PROP_FRAME_HEIGHT, CAM_HEIGHT)

last_action_time = 0
COOLDOWN_DELAY = 0.5

while True:
  success, image = cap.read()
  if not success:
    break

  image = cv.flip(image, 1)
  rgb_image = cv.cvtColor(image, cv.COLOR_BGR2RGB)

  # Modern API formatting
  mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
  results = detector.detect(mp_image)

  if results.hand_landmarks:
    # Extract first hand
    hand_landmarks = results.hand_landmarks[0]

    # Convert normalized coordinates to pixel coordinates
    h, w, _ = image.shape
    pixel_landmarks = [(int(lm.x * w), int(lm.y * h)) for lm in hand_landmarks]

    draw_hand(image, pixel_landmarks)

    index_tip = pixel_landmarks[8]
    thumb_tip = pixel_landmarks[4]
    index_x, index_y = index_tip

    move_cursor(index_x, index_y)
    handle_mode_switch(pixel_landmarks)

    now = time.time()
    if (now - last_action_time) > COOLDOWN_DELAY:
      if detect_pinch(thumb_tip, index_tip):
        execute_action("PINCH_CLICK")
        last_action_time = now
        cv.putText(image, "CLICK", (20, 80), cv.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
      elif detect_open_palm(pixel_landmarks):
        execute_action("OPEN_PALM")
        last_action_time = now
        cv.putText(image, "PALM ACTION", (20, 80), cv.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)

    if not detect_open_palm(pixel_landmarks):
      scroll_dir = get_scroll_direction(index_y)
      if scroll_dir:
        execute_action(scroll_dir)
        cv.putText(image, scroll_dir, (20, 110), cv.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)

  # UI Rendering
  cv.putText(image, f"MODE: {current_mode}", (20, 40), cv.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

  if fist_start_time is not None:
    progress = min(1.0, (time.time() - fist_start_time) / FIST_HOLD_DURATION)
    bar_width = int(200 * progress)
    cv.rectangle(image, (20, 430), (220, 445), (50, 50, 50), -1)
    cv.rectangle(image, (20, 430), (20 + bar_width, 445), (0, 255, 0), -1)
    cv.putText(image, "HOLD FIST TO SWITCH MODE", (20, 420), cv.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

  cv.imshow("Kinetix MVP", image)

  if cv.waitKey(1) == 27:
    break

cap.release()
cv.destroyAllWindows()