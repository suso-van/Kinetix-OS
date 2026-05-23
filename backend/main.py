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

    # 1. Cursor movement (STRICTLY tied to navigation posture)
    if gestures.is_navigation_posture(pixel_landmarks):
      cursor_active = True
      cursor.move(index_tip[0], index_tip[1])
      if gestures.detect_pinch(thumb_tip, index_tip):
        router.execute_action("PINCH_CLICK")

    # 2. Scrolling
    elif gestures.is_scroll_posture(pixel_landmarks):
      if scroll_posture_start is None:
        scroll_posture_start = time.time()
      elif time.time() - scroll_posture_start >= SCROLL_HOLD_DURATION:
        scroll_dir = gestures.get_scroll_direction(index_tip[1])
        if scroll_dir:
          router.execute_action(scroll_dir)
    else:
      scroll_posture_start = None

    # 3. Swipes (STRICTLY tied to open palm posture)
    if gestures.is_swipe_posture(pixel_landmarks):
      swipe_dir = gestures.detect_swipe(index_tip)
      if swipe_dir:
        router.execute_action(swipe_dir)
      else:
        # Only fire OPEN_PALM when hand is genuinely still —
        # not while a swipe is building in the buffer
        x_drift = 0
        if len(gestures.swipe_buffer) >= 3:
          x_drift = abs(gestures.swipe_buffer[-1] - gestures.swipe_buffer[0])
        if x_drift < 25:
          router.execute_action("OPEN_PALM")

    # 4. Two-finger swipe (tab switching)
    two_finger_swipe = gestures.detect_two_finger_swipe(pixel_landmarks, index_tip)
    if two_finger_swipe == "SWIPE_LEFT":
      router.execute_action("TWO_FINGER_SWIPE_LEFT")
    elif two_finger_swipe == "SWIPE_RIGHT":
      router.execute_action("TWO_FINGER_SWIPE_RIGHT")

    # 5. Static finger-count gestures (3 = YouTube, 4 = GitHub)
    # Only check when NOT in navigation or scroll posture to avoid conflicts
    if (not gestures.is_navigation_posture(pixel_landmarks) and
        not gestures.is_scroll_posture(pixel_landmarks)):
      finger_gesture = gestures.detect_finger_count_gesture(pixel_landmarks)
      if finger_gesture:
        router.execute_action(finger_gesture)
      else:
        # Clear hold timers if the pose was broken before firing
        router.hold_start_times.pop("THREE_FINGER_HOLD", None)
        router.hold_start_times.pop("FOUR_FINGER_HOLD", None)

  else:
    scroll_posture_start = None
    calibration_start_time = None
    gestures.swipe_buffer.clear()

  # UI Dashboard
  if is_calibrated:
    cv.putText(image, "TRAE SPATIAL BROWSER", (20, 40), cv.FONT_HERSHEY_SIMPLEX, 0.8, (255, 150, 0), 2)

    status_color = (0, 255, 0) if cursor_active else (100, 100, 100)
    cv.putText(image, f"CURSOR: {'ACTIVE' if cursor_active else 'LOCKED'}", (20, 75), cv.FONT_HERSHEY_SIMPLEX, 0.6,
               status_color, 2)

    if time.time() - router.action_display_time < 1.5:
      cv.putText(image, f"DETECTED: {router.latest_gesture}", (20, 120), cv.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200),
                 2)
      cv.putText(image, f"ROUTED  : {router.latest_action}", (20, 150), cv.FONT_HERSHEY_SIMPLEX, 0.7, (100, 255, 100),
                 2)

  cv.imshow("TRAE Spatial Browser", image)
  if cv.waitKey(1) == 27:
    break

cap.release()
cv.destroyAllWindows()