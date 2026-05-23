# main.py
import cv2 as cv
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import time

from config import CAM_WIDTH, CAM_HEIGHT, FIST_HOLD_DURATION, COOLDOWN_DELAY
from cursor import CursorManager
from router import ActionRouter
import gestures

# =========================
# SETUP
# =========================
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
  for connection in HAND_CONNECTIONS:
    start_idx, end_idx = connection
    cv.line(image, pixel_landmarks[start_idx], pixel_landmarks[end_idx], (0, 255, 0), 2)
  for point in pixel_landmarks:
    cv.circle(image, point, 4, (0, 0, 255), -1)


# Initialize modules
cursor = CursorManager()
router = ActionRouter()

cap = cv.VideoCapture(0)
cap.set(cv.CAP_PROP_FRAME_WIDTH, CAM_WIDTH)
cap.set(cv.CAP_PROP_FRAME_HEIGHT, CAM_HEIGHT)

# =========================
# MAIN LOOP
# =========================
while True:
  success, image = cap.read()
  if not success:
    break

  image = cv.flip(image, 1)
  rgb_image = cv.cvtColor(image, cv.COLOR_BGR2RGB)
  mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
  results = detector.detect(mp_image)

  if results.hand_landmarks:
    hand_landmarks = results.hand_landmarks[0]
    h, w, _ = image.shape
    pixel_landmarks = [(int(lm.x * w), int(lm.y * h)) for lm in hand_landmarks]

    draw_hand(image, pixel_landmarks)

    index_tip = pixel_landmarks[8]
    thumb_tip = pixel_landmarks[4]

    # 1. Move Cursor
    cursor.move(index_tip[0], index_tip[1])

    # 2. Check for Mode Switch
    router.handle_mode_switch(pixel_landmarks)

    # 3. Handle discrete gestures (with cooldown)
    now = time.time()
    if (now - router.last_action_time) > COOLDOWN_DELAY:
      if gestures.detect_pinch(thumb_tip, index_tip):
        router.execute_action("PINCH_CLICK")
        router.last_action_time = now
        cv.putText(image, "CLICK", (20, 80), cv.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

      elif gestures.detect_open_palm(pixel_landmarks):
        router.execute_action("OPEN_PALM")
        router.last_action_time = now
        cv.putText(image, "PALM ACTION", (20, 80), cv.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)

    # 4. Handle scrolling (bypass cooldown, but check palm state)
    if not gestures.detect_open_palm(pixel_landmarks):
      scroll_dir = gestures.get_scroll_direction(index_tip[1])
      if scroll_dir:
        router.execute_action(scroll_dir)
        cv.putText(image, scroll_dir, (20, 110), cv.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)

  # UI Rendering
  cv.putText(image, f"MODE: {router.current_mode}", (20, 40), cv.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

  if router.fist_start_time is not None:
    progress = min(1.0, (time.time() - router.fist_start_time) / FIST_HOLD_DURATION)
    bar_width = int(200 * progress)
    cv.rectangle(image, (20, 430), (220, 445), (50, 50, 50), -1)
    cv.rectangle(image, (20, 430), (20 + bar_width, 445), (0, 255, 0), -1)
    cv.putText(image, "HOLD FIST TO SWITCH MODE", (20, 420), cv.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

  cv.imshow("Kinetix MVP", image)

  if cv.waitKey(1) == 27:
    break

cap.release()
cv.destroyAllWindows()