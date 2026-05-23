# gestures.py
import math
from collections import deque
from config import CLICK_THRESHOLD, SCROLL_THRESHOLD, SWIPE_THRESHOLD

prev_scroll_y = 0
swipe_buffer = deque(maxlen=15)
whole_hand_swipe_buffer = deque(maxlen=20)  # Separate buffer for whole hand swipes
scroll_y_buffer = deque(maxlen=4)
_palm_open_state = False


def detect_pinch(thumb, index):
  return math.hypot(thumb[0] - index[0], thumb[1] - index[1]) < CLICK_THRESHOLD


def get_scroll_direction(index_y):
  global prev_scroll_y
  scroll_y_buffer.append(index_y)

  # Need full buffer before firing
  if len(scroll_y_buffer) < scroll_y_buffer.maxlen:
    prev_scroll_y = index_y
    return None

  # Compare smoothed current against smoothed previous window
  smoothed = sum(scroll_y_buffer) / len(scroll_y_buffer)
  diff = smoothed - prev_scroll_y
  prev_scroll_y = smoothed

  if abs(diff) > SCROLL_THRESHOLD:
    return "SCROLL_DOWN" if diff > 0 else "SCROLL_UP"
  return None


def count_extended_fingers(pixel_landmarks):
  """Returns how many fingers (excluding thumb) are extended."""
  tips = [8, 12, 16, 20]
  pips = [6, 10, 14, 18]
  return sum(1 for tip, pip in zip(tips, pips)
             if pixel_landmarks[tip][1] < pixel_landmarks[pip][1])


def detect_specific_finger_combination(pixel_landmarks):
  """
  Detect specific finger combinations:
  - Index + Pinky up -> "INDEX_PINKY"
  - Index + Ring up -> "INDEX_RING"
  """
  index_up = pixel_landmarks[8][1] < pixel_landmarks[6][1]
  middle_up = pixel_landmarks[12][1] < pixel_landmarks[10][1]
  ring_up = pixel_landmarks[16][1] < pixel_landmarks[14][1]
  pinky_up = pixel_landmarks[20][1] < pixel_landmarks[18][1]

  # Index + Pinky only (others down)
  if index_up and pinky_up and not middle_up and not ring_up:
    return "INDEX_PINKY"

  # Index + Ring only (others down)
  if index_up and ring_up and not middle_up and not pinky_up:
    return "INDEX_RING"

  return None


def detect_two_finger_swipe(pixel_landmarks, index_tip):
  """Index + middle up, ring + pinky down."""
  index_up = pixel_landmarks[8][1] < pixel_landmarks[6][1]
  middle_up = pixel_landmarks[12][1] < pixel_landmarks[10][1]
  ring_down = pixel_landmarks[16][1] > pixel_landmarks[14][1]
  pinky_down = pixel_landmarks[20][1] > pixel_landmarks[18][1]

  if index_up and middle_up and ring_down and pinky_down:
    return detect_swipe(index_tip, buffer_type="two_finger")  # Use two-finger specific buffer
  return None


def detect_finger_count_gesture(pixel_landmarks):
  """
  Returns a gesture name if a static multi-finger pose is held.
  3 fingers = THREE_FINGER_HOLD
  4 fingers = FOUR_FINGER_HOLD
  Returns None otherwise.
  """
  count = count_extended_fingers(pixel_landmarks)
  if count == 3:
    return "THREE_FINGER_HOLD"
  if count == 4:
    return "FOUR_FINGER_HOLD"
  return None


def detect_open_palm(pixel_landmarks):
  global _palm_open_state
  tips = [8, 12, 16, 20]
  pips = [6, 10, 14, 18]
  open_count = sum(1 for tip, pip in zip(tips, pips)
                   if pixel_landmarks[tip][1] < pixel_landmarks[pip][1])

  # Open: require 4 fingers. Close: only drop out at 2 or fewer.
  # This prevents flickering at the 3-finger boundary.
  if open_count >= 4:
    _palm_open_state = True
  elif open_count <= 2:
    _palm_open_state = False

  return _palm_open_state


def is_scroll_posture(pixel_landmarks):
  index_up = pixel_landmarks[8][1] < pixel_landmarks[6][1]
  middle_up = pixel_landmarks[12][1] < pixel_landmarks[10][1]
  ring_down = pixel_landmarks[16][1] > pixel_landmarks[14][1]
  return index_up and middle_up and ring_down


def is_navigation_posture(pixel_landmarks):
  # Only index finger extended, others curled
  index_up = pixel_landmarks[8][1] < pixel_landmarks[6][1]
  middle_down = pixel_landmarks[12][1] > pixel_landmarks[10][1]
  ring_down = pixel_landmarks[16][1] > pixel_landmarks[14][1]
  pinky_down = pixel_landmarks[20][1] > pixel_landmarks[18][1]
  return index_up and middle_down and ring_down and pinky_down


def is_swipe_posture(pixel_landmarks):
  # Require an open hand to initiate a swipe
  return detect_open_palm(pixel_landmarks)


def detect_swipe(index_tip, buffer_type="whole_hand"):
  """Detect swipe gesture with separate buffers for whole hand vs two-finger"""
  global swipe_buffer, whole_hand_swipe_buffer

  # Use appropriate buffer
  if buffer_type == "two_finger":
    buffer = swipe_buffer
  else:
    buffer = whole_hand_swipe_buffer

  buffer.append(index_tip[0])

  if len(buffer) == buffer.maxlen:
    # Calculate movement with acceleration detection
    start_pos = buffer[0]
    end_pos = buffer[-1]
    diff = end_pos - start_pos

    # Check for consistent direction (not oscillating)
    mid_pos = buffer[len(buffer) // 2]
    mid_diff = mid_pos - start_pos

    # Ensure movement is consistently in one direction
    if diff > SWIPE_THRESHOLD and mid_diff > 0:
      buffer.clear()
      if buffer_type == "two_finger":
        return "SWIPE_RIGHT"
      else:
        return "WHOLE_HAND_SWIPE_RIGHT"
    elif diff < -SWIPE_THRESHOLD and mid_diff < 0:
      buffer.clear()
      if buffer_type == "two_finger":
        return "SWIPE_LEFT"
      else:
        return "WHOLE_HAND_SWIPE_LEFT"

  return None


def detect_whole_hand_swipe(pixel_landmarks, palm_center):
  """Detect whole hand swipe (app switching)"""
  if detect_open_palm(pixel_landmarks):
    return detect_swipe(palm_center, buffer_type="whole_hand")
  return None