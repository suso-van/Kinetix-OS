# gestures.py
import math
from collections import deque
from config import CLICK_THRESHOLD, SCROLL_THRESHOLD, SWIPE_THRESHOLD

# The new Anchor variable for perfectly symmetrical scrolling
scroll_anchor_y = None

# Buffers tuned for smooth sweeping rather than jittery snaps
two_finger_swipe_buffer = deque(maxlen=6)
whole_hand_swipe_buffer = deque(maxlen=6)
_palm_open_state = False


def detect_pinch(thumb, index):
  return math.hypot(thumb[0] - index[0], thumb[1] - index[1]) < CLICK_THRESHOLD


def get_scroll_direction(index_y):
  global scroll_anchor_y

  # Lock the anchor on the first frame of scrolling
  if scroll_anchor_y is None:
    scroll_anchor_y = index_y
    return None

  # Calculate exact absolute movement from the anchor
  diff = index_y - scroll_anchor_y

  # If we moved enough pixels, trigger scroll and reset anchor
  if abs(diff) > SCROLL_THRESHOLD:
    scroll_anchor_y = index_y
    return "SCROLL_DOWN" if diff > 0 else "SCROLL_UP"

  return None


def reset_scroll_anchor():
  """Clears the anchor when the user stops scrolling."""
  global scroll_anchor_y
  scroll_anchor_y = None


def detect_specific_finger_combination(pixel_landmarks):
  index_up = pixel_landmarks[8][1] < pixel_landmarks[6][1]
  middle_up = pixel_landmarks[12][1] < pixel_landmarks[10][1]
  ring_up = pixel_landmarks[16][1] < pixel_landmarks[14][1]
  pinky_up = pixel_landmarks[20][1] < pixel_landmarks[18][1]

  if index_up and pinky_up and not middle_up and not ring_up:
    return "INDEX_PINKY"
  if index_up and ring_up and not middle_up and not pinky_up:
    return "INDEX_RING"

  return None


def detect_two_finger_swipe(pixel_landmarks, index_tip):
  global two_finger_swipe_buffer

  index_up = pixel_landmarks[8][1] < pixel_landmarks[6][1]
  middle_up = pixel_landmarks[12][1] < pixel_landmarks[10][1]
  ring_down = pixel_landmarks[16][1] > pixel_landmarks[14][1]
  pinky_down = pixel_landmarks[20][1] > pixel_landmarks[18][1]

  if index_up and middle_up and ring_down and pinky_down:
    two_finger_swipe_buffer.append(index_tip[0])

    if len(two_finger_swipe_buffer) == two_finger_swipe_buffer.maxlen:
      start_x = two_finger_swipe_buffer[0]
      end_x = two_finger_swipe_buffer[-1]
      movement = end_x - start_x

      if movement > SWIPE_THRESHOLD:
        two_finger_swipe_buffer.clear()
        return "SWIPE_RIGHT"
      elif movement < -SWIPE_THRESHOLD:
        two_finger_swipe_buffer.clear()
        return "SWIPE_LEFT"
  else:
    if len(two_finger_swipe_buffer) > 0:
      two_finger_swipe_buffer.clear()

  return None


def detect_open_palm(pixel_landmarks):
  global _palm_open_state
  tips = [8, 12, 16, 20]
  pips = [6, 10, 14, 18]
  open_count = sum(1 for tip, pip in zip(tips, pips)
                   if pixel_landmarks[tip][1] < pixel_landmarks[pip][1])

  if open_count >= 4:
    _palm_open_state = True
  elif open_count <= 2:
    _palm_open_state = False

  return _palm_open_state


def is_scroll_posture(pixel_landmarks):
  index_up = pixel_landmarks[8][1] < pixel_landmarks[6][1]
  middle_up = pixel_landmarks[12][1] < pixel_landmarks[10][1]
  ring_down = pixel_landmarks[16][1] > pixel_landmarks[14][1]
  pinky_down = pixel_landmarks[20][1] > pixel_landmarks[18][1]
  return index_up and middle_up and ring_down and pinky_down


def is_navigation_posture(pixel_landmarks):
  index_up = pixel_landmarks[8][1] < pixel_landmarks[6][1]
  middle_down = pixel_landmarks[12][1] > pixel_landmarks[10][1]
  ring_down = pixel_landmarks[16][1] > pixel_landmarks[14][1]
  pinky_down = pixel_landmarks[20][1] > pixel_landmarks[18][1]
  return index_up and middle_down and ring_down and pinky_down


def detect_whole_hand_swipe(pixel_landmarks, palm_center):
  global whole_hand_swipe_buffer

  if detect_open_palm(pixel_landmarks):
    whole_hand_swipe_buffer.append(palm_center[0])

    if len(whole_hand_swipe_buffer) == whole_hand_swipe_buffer.maxlen:
      start_x = whole_hand_swipe_buffer[0]
      end_x = whole_hand_swipe_buffer[-1]
      movement = end_x - start_x

      if movement > SWIPE_THRESHOLD:
        whole_hand_swipe_buffer.clear()
        return "WHOLE_HAND_SWIPE_RIGHT"
      elif movement < -SWIPE_THRESHOLD:
        whole_hand_swipe_buffer.clear()
        return "WHOLE_HAND_SWIPE_LEFT"
  else:
    if len(whole_hand_swipe_buffer) > 0:
      whole_hand_swipe_buffer.clear()

  return None