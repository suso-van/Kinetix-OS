# main.py
import cv2 as cv
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import time
import os

from config import CAM_WIDTH, CAM_HEIGHT, FIST_HOLD_DURATION, SCROLL_HOLD_DURATION, CALIBRATION_DURATION
from cursor import CursorManager
from workflow_router import TRAEWorkflowRouter
import gestures

# =========================
# SYSTEM CHECKS
# =========================
if not os.path.exists('hand_landmarker.task'):
    print("CRITICAL: 'hand_landmarker.task' missing. Download MediaPipe asset before demo.")
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

# State Variables
calibration_start_time = None
is_calibrated = False
scroll_posture_start = None

# =========================
# MAIN LOOP
# =========================
while True:
    success, image = cap.read()
    if not success: break

    image = cv.flip(image, 1)
    rgb_image = cv.cvtColor(image, cv.COLOR_BGR2RGB)
    results = detector.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image))

    cursor_active = False

    if results.hand_landmarks:
        h, w, _ = image.shape
        pixel_landmarks = [(int(lm.x * w), int(lm.y * h)) for lm in results.hand_landmarks[0]]
        draw_hand(image, pixel_landmarks)

        # 1. Startup Calibration Phase
        if not is_calibrated:
            if calibration_start_time is None:
                calibration_start_time = time.time()
            elif time.time() - calibration_start_time > CALIBRATION_DURATION:
                is_calibrated = True
            else:
                cv.putText(image, "CALIBRATING SYSTEM...", (150, 240), cv.FONT_HERSHEY_SIMPLEX, 1, (0, 165, 255), 3)
                cv.imshow("TRAE Spatial OS", image)
                cv.waitKey(1)
                continue

        index_tip = pixel_landmarks[8]
        thumb_tip = pixel_landmarks[4]

        # 2. Check Structural Gestures (Freezes Cursor)
        is_fist = gestures.detect_fist(pixel_landmarks)
        is_palm = gestures.detect_open_palm(pixel_landmarks)
        cursor_active = not (is_fist or is_palm)

        router.handle_mode_switch(pixel_landmarks)

        if is_palm:
            router.execute_action("OPEN_PALM")

        # 3. Cursor & Movement Actions (Only if cursor is active)
        if cursor_active:
            cursor.move(index_tip[0], index_tip[1])

            # Scroll handling with 150ms hold
            if gestures.is_scroll_posture(pixel_landmarks):
                if scroll_posture_start is None:
                    scroll_posture_start = time.time()
                elif time.time() - scroll_posture_start >= SCROLL_HOLD_DURATION:
                    scroll_dir = gestures.get_scroll_direction(index_tip[1])
                    if scroll_dir:
                        router.execute_action(scroll_dir)
            else:
                scroll_posture_start = None

            # Swipe handling
            swipe_dir = gestures.detect_swipe(index_tip)
            if swipe_dir:
                router.execute_action(swipe_dir)

            # Discrete clicks
            if gestures.detect_pinch(thumb_tip, index_tip):
                router.execute_action("PINCH_CLICK")
    else:
        scroll_posture_start = None
        calibration_start_time = None # Reset calibration if hand leaves frame during boot

    # =========================
    # UI OVERLAYS & FEEDBACK
    # =========================
    if is_calibrated:
        # Dynamic Colors based on mode
        mode_colors = {"BROWSER": (255, 150, 0), "MEDIA": (200, 0, 255), "DOCTOR": (0, 255, 255)}
        current_color = mode_colors.get(router.current_mode, (255, 255, 255))

        # Core HUD
        cv.putText(image, f"TRAE WORKFLOW: {router.current_mode}", (20, 40), cv.FONT_HERSHEY_SIMPLEX, 0.8, current_color, 2)
        status_color = (0, 255, 0) if cursor_active else (0, 0, 255)
        cv.putText(image, f"CURSOR ACTIVE: {cursor_active}", (20, 75), cv.FONT_HERSHEY_SIMPLEX, 0.6, status_color, 2)

        # Action Feedback pop-up (lasts 1.5 seconds)
        if time.time() - router.action_display_time < 1.5:
            cv.putText(image, f"GESTURE: {router.latest_gesture}", (20, 120), cv.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 2)
            cv.putText(image, f"ACTION : {router.latest_action}", (20, 150), cv.FONT_HERSHEY_SIMPLEX, 0.7, (100, 255, 100), 2)

        # Fist Hold progress bar
        if router.fist_start_time is not None:
            progress = min(1.0, (time.time() - router.fist_start_time) / FIST_HOLD_DURATION)
            cv.rectangle(image, (20, 430), (220, 445), (50, 50, 50), -1)
            cv.rectangle(image, (20, 430), (20 + int(200 * progress), 445), current_color, -1)
            cv.putText(image, "HOLD FIST TO SWITCH WORKFLOW", (20, 420), cv.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

    cv.imshow("TRAE Spatial OS", image)
    if cv.waitKey(1) == 27:
        break

cap.release()
cv.destroyAllWindows()