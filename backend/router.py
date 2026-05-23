# router.py
import time
import pyautogui
import keyboard
import webbrowser
from config import FIST_HOLD_DURATION
from gestures import detect_fist


class ActionRouter:
  def __init__(self):
    self.current_mode = "BROWSER"
    self.fist_start_time = None
    self.last_action_time = 0

    self.ACTION_MAP = {
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
    self.MODES = list(self.ACTION_MAP.keys())

  def execute_action(self, gesture_name):
    action = self.ACTION_MAP.get(self.current_mode, {}).get(gesture_name)
    if action:
      action()
      print(f"[{self.current_mode}] Executed: {gesture_name}")

  def handle_mode_switch(self, pixel_landmarks):
    if detect_fist(pixel_landmarks):
      if self.fist_start_time is None:
        self.fist_start_time = time.time()
      elif time.time() - self.fist_start_time >= FIST_HOLD_DURATION:
        idx = (self.MODES.index(self.current_mode) + 1) % len(self.MODES)
        self.current_mode = self.MODES[idx]
        print(f"MODE SWAPPED → {self.current_mode}")
        self.fist_start_time = None
    else:
      self.fist_start_time = None