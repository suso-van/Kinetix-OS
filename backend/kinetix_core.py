# kinetix_core.py

import cv2 as cv
import mediapipe as mp
import numpy as np
import pyautogui
import math
import time
import webbrowser

CAM_WIDTH = 640
CAM_HEIGHT = 480

SMOOTHING = 0.2
CLICK_THRESHOLD = 35
SCROLL_THRESHOLD = 25

SCREEN_WIDTH, SCREEN_HEIGHT = pyautogui.size()

pyautogui.FAILSAFE = False

mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils

hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)

cap = cv.VideoCapture(0)
cap.set(cv.CAP_PROP_FRAME_WIDTH, CAM_WIDTH)
cap.set(cv.CAP_PROP_FRAME_HEIGHT, CAM_HEIGHT)

prev_x = 0
prev_y = 0

prev_scroll_y = 0

last_click_time = 0
CLICK_COOLDOWN = 0.8

last_gesture_time = 0
GESTURE_COOLDOWN = 1.5

# =========================
# HELPER FUNCTIONS
# =========================

def get_landmark_positions(image, hand_landmarks):
    h, w, _ = image.shape
    landmark_list = []

    for landmark in hand_landmarks.landmark:
        x = int(landmark.x * w)
        y = int(landmark.y * h)
        landmark_list.append((x, y))

    return landmark_list


def smooth_movement(current_x, current_y, prev_x, prev_y):
    smooth_x = prev_x + (current_x - prev_x) * SMOOTHING
    smooth_y = prev_y + (current_y - prev_y) * SMOOTHING
    return smooth_x, smooth_y


def move_cursor(index_x, index_y):
    global prev_x, prev_y

    # Reduced interaction zone
    frame_margin_x = 100
    frame_margin_y = 60

    index_x = np.clip(index_x, frame_margin_x, CAM_WIDTH - frame_margin_x)
    index_y = np.clip(index_y, frame_margin_y, CAM_HEIGHT - frame_margin_y)

    # Convert to screen coords
    screen_x = np.interp(
        index_x,
        (frame_margin_x, CAM_WIDTH - frame_margin_x),
        (0, SCREEN_WIDTH)
    )

    screen_y = np.interp(
        index_y,
        (frame_margin_y, CAM_HEIGHT - frame_margin_y),
        (0, SCREEN_HEIGHT)
    )

    # Smooth movement
    smooth_x, smooth_y = smooth_movement(
        screen_x,
        screen_y,
        prev_x,
        prev_y
    )

    prev_x, prev_y = smooth_x, smooth_y

    pyautogui.moveTo(smooth_x, smooth_y)


def detect_pinch(thumb, index):
    thumb_x, thumb_y = thumb
    index_x, index_y = index

    distance = math.hypot(
        thumb_x - index_x,
        thumb_y - index_y
    )

    return distance < CLICK_THRESHOLD


def perform_click():
    global last_click_time

    current_time = time.time()

    if current_time - last_click_time > CLICK_COOLDOWN:
        pyautogui.click()
        last_click_time = current_time
        print("CLICK")


def detect_scroll(index_y):
    global prev_scroll_y

    diff = index_y - prev_scroll_y

    if abs(diff) > SCROLL_THRESHOLD:

        # Swipe down
        if diff > 0:
            pyautogui.scroll(-80)
            print("SCROLL DOWN")

        # Swipe up
        else:
            pyautogui.scroll(80)
            print("SCROLL UP")

    prev_scroll_y = index_y


def detect_open_palm(landmarks):
    """
    Basic open palm detection.
    Checks if fingertips are above lower finger joints.
    """

    tips = [8, 12, 16, 20]
    pips = [6, 10, 14, 18]

    fingers_open = 0

    for tip, pip in zip(tips, pips):
        if landmarks[tip][1] < landmarks[pip][1]:
            fingers_open += 1

    return fingers_open >= 4


def launch_youtube():
    global last_gesture_time

    current_time = time.time()

    if current_time - last_gesture_time > GESTURE_COOLDOWN:
        webbrowser.open("https://youtube.com")
        print("OPENING YOUTUBE")
        last_gesture_time = current_time


# =========================
# MAIN LOOP
# =========================

while True:

    success, image = cap.read()

    if not success:
        break

    image = cv.flip(image, 1)

    rgb_image = cv.cvtColor(image, cv.COLOR_BGR2RGB)

    results = hands.process(rgb_image)

    if results.multi_hand_landmarks:

        for hand_landmarks in results.multi_hand_landmarks:

            mp_draw.draw_landmarks(
                image,
                hand_landmarks,
                mp_hands.HAND_CONNECTIONS
            )

            landmarks = get_landmark_positions(image, hand_landmarks)

            # =========================
            # IMPORTANT LANDMARKS
            # =========================

            index_tip = landmarks[8]
            thumb_tip = landmarks[4]

            index_x, index_y = index_tip

            # =========================
            # CURSOR CONTROL
            # =========================

            move_cursor(index_x, index_y)

            # =========================
            # PINCH CLICK
            # =========================

            pinch = detect_pinch(thumb_tip, index_tip)

            if pinch:
                perform_click()

                cv.putText(
                    image,
                    "PINCH CLICK",
                    (20, 50),
                    cv.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 255, 0),
                    2
                )

            # =========================
            # SCROLL GESTURE
            # =========================

            detect_scroll(index_y)

            # =========================
            # OPEN PALM GESTURE
            # =========================

            if detect_open_palm(landmarks):

                cv.putText(
                    image,
                    "OPEN PALM",
                    (20, 100),
                    cv.FONT_HERSHEY_SIMPLEX,
                    1,
                    (255, 0, 0),
                    2
                )

                launch_youtube()

    cv.putText(
        image,
        "KINETIX MVP",
        (20, 450),
        cv.FONT_HERSHEY_SIMPLEX,
        1,
        (255, 255, 255),
        2
    )

    cv.imshow("Kinetix", image)

    key = cv.waitKey(1)

    if key == 27:
        break

cap.release()
cv.destroyAllWindows()