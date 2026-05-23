# main.py
import cv2 as cv
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import time
import os

from config import CAM_WIDTH, CAM_HEIGHT, SCROLL_HOLD_DURATION, CALIBRATION_DURATION, FRAME_MARGIN_X, FRAME_MARGIN_Y
from cursor import CursorManager
from workflow_router import TRAEWorkflowRouter
import gestures

if not os.path.exists('hand_landmarker.task'):
  print("CRITICAL: 'hand_landmarker.task' missing.")
  exit(1)

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
  (0, 1), (1, 2), (2, 3), (3, 4),
  (0, 5), (5, 6), (6, 7), (7, 8),
  (5, 9), (9, 10), (10, 11), (11, 12),
  (9, 13), (13, 14), (14, 15), (15, 16),
  (13, 17), (17, 18), (18, 19), (19, 20),
  (0, 17)
]


def draw_hand(image, pixel_landmarks):
  for connection in HAND_CONNECTIONS:
    cv.line(image, pixel_landmarks[connection[0]], pixel_landmarks[connection[1]], (0, 255, 0), 2)
  for point in pixel_landmarks:
    cv.circle(image, point, 4, (0, 0, 255), -1)


cursor = CursorManager()
router = TRAEWorkflowRouter()

cap = cv.VideoCapture(0)
cap.set(cv.CAP_PROP_FRAME_WIDTH, CAM_WIDTH)
cap.set(cv.CAP_PROP_FRAME_HEIGHT, CAM_HEIGHT)

calibration_start_time = None
is_calibrated = False
scroll_posture_start = None

# Debug counters
frame_count = 0

while True:
  success, image = cap.read()
  if not success: break

  image = cv.flip(image, 1)

  # Draw Interaction Bounding Box
  cv.rectangle(image, (FRAME_MARGIN_X, FRAME_MARGIN_Y),
               (CAM_WIDTH - FRAME_MARGIN_X, CAM_HEIGHT - FRAME_MARGIN_Y),
               (255, 255, 255), 1)

  rgb_image = cv.cvtColor(image, cv.COLOR_BGR2RGB)
  results = detector.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image))

  cursor_active = False

  if results.hand_landmarks:
    h, w, _ = image.shape
    pixel_landmarks = [(int(lm.x * w), int(lm.y * h)) for lm in results.hand_landmarks[0]]
    draw_hand(image, pixel_landmarks)

    # Get palm center (landmark 0 - wrist)
    palm_center = pixel_landmarks[0]

    if not is_calibrated:
      if calibration_start_time is None:
        calibration_start_time = time.time()
      elif time.time() - calibration_start_time > CALIBRATION_DURATION:
        is_calibrated = True
      else:
        cv.putText(image, "CALIBRATING TRAE...", (180, 240), cv.FONT_HERSHEY_SIMPLEX, 1, (0, 165, 255), 3)
        cv.imshow("TRAE Spatial Browser", image)
        cv.waitKey(1)
        continue

    index_tip = pixel_landmarks[8]
    thumb_tip = pixel_landmarks[4]

    # Check postures for debugging
    nav_posture = gestures.is_navigation_posture(pixel_landmarks)
    scroll_posture = gestures.is_scroll_posture(pixel_landmarks)
    open_palm = gestures.detect_open_palm(pixel_landmarks)

    # Draw posture info on screen
    y_offset = 200
    cv.putText(image, f"Nav: {nav_posture}", (20, y_offset), cv.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
    cv.putText(image, f"Scroll: {scroll_posture}", (20, y_offset + 20), cv.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200),
               1)
    cv.putText(image, f"Open Palm: {open_palm}", (20, y_offset + 40), cv.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

    # 1. Cursor movement (STRICTLY tied to navigation posture)
    if nav_posture:
      cursor_active = True
      cursor.move(index_tip[0], index_tip[1])
      if gestures.detect_pinch(thumb_tip, index_tip):
        router.execute_action("PINCH_CLICK")

    # 2. Scrolling
    elif scroll_posture:
      if scroll_posture_start is None:
        scroll_posture_start = time.time()
      elif time.time() - scroll_posture_start >= SCROLL_HOLD_DURATION:
        scroll_dir = gestures.get_scroll_direction(index_tip[1])
        if scroll_dir:
          router.execute_action(scroll_dir)
    else:
      scroll_posture_start = None

    # 3. Whole Hand Swipe (App Switching) - HIGH PRIORITY
    whole_hand_swipe = gestures.detect_whole_hand_swipe(pixel_landmarks, palm_center)
    if whole_hand_swipe:
      router.execute_action(whole_hand_swipe)

    # 4. Two-finger swipe (tab switching)
    two_finger_swipe = gestures.detect_two_finger_swipe(pixel_landmarks, index_tip)
    if two_finger_swipe:
      router.execute_action(two_finger_swipe)

    # 5. Static finger gestures (only when not in navigation or scroll)
    if not nav_posture and not scroll_posture:
      # Check for specific finger combinations (Index+Pinky, Index+Ring)
      finger_combo = gestures.detect_specific_finger_combination(pixel_landmarks)
      if finger_combo:
        router.execute_action(finger_combo)

      # Check for finger count gestures
      finger_gesture = gestures.detect_finger_count_gesture(pixel_landmarks)
      if finger_gesture:
        router.execute_action(finger_gesture)
      else:
        # Clear hold timers if the pose was broken before firing
        for gesture in ["THREE_FINGER_HOLD", "FOUR_FINGER_HOLD", "INDEX_PINKY", "INDEX_RING"]:
          router.hold_start_times.pop(gesture, None)

  else:
    scroll_posture_start = None
    calibration_start_time = None
    # Clear buffers when no hand detected
    gestures.two_finger_swipe_buffer.clear()
    gestures.whole_hand_swipe_buffer.clear()

  # UI Dashboard
  if is_calibrated:
    cv.putText(image, "TRAE SPATIAL BROWSER", (20, 40), cv.FONT_HERSHEY_SIMPLEX, 0.8, (255, 150, 0), 2)

    status_color = (0, 255, 0) if cursor_active else (100, 100, 100)
    cv.putText(image, f"CURSOR: {'ACTIVE' if cursor_active else 'LOCKED'}", (20, 75), cv.FONT_HERSHEY_SIMPLEX, 0.6,
               status_color, 2)

    if time.time() - router.action_display_time < 1.5:
      # Highlight swipe actions
      color = (100, 255, 100) if "SWIPE" in router.latest_gesture else (200, 200, 200)
      cv.putText(image, f"DETECTED: {router.latest_gesture}", (20, 120), cv.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
      cv.putText(image, f"ROUTED  : {router.latest_action}", (20, 150), cv.FONT_HERSHEY_SIMPLEX, 0.7, (100, 255, 100),
                 2)

  frame_count += 1
  cv.imshow("TRAE Spatial Browser", image)
  if cv.waitKey(1) == 27:
    break

cap.release()
cv.destroyAllWindows()