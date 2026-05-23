# workflow_router.py
import time
import pyautogui
import webbrowser
import subprocess
import platform
import json
import keyboard
from config import PER_GESTURE_COOLDOWN, OPEN_PALM_COOLDOWN, SCROLL_COOLDOWN

ACTION_HANDLERS = {
  "click": lambda: pyautogui.click(),
  "scroll_up": lambda: pyautogui.scroll(30),
  "scroll_down": lambda: pyautogui.scroll(-30),
  "home_page": lambda: webbrowser.open("https://google.com"),
  "prev_tab": lambda: keyboard.press_and_release("ctrl+shift+tab"),
  "next_tab": lambda: keyboard.press_and_release("ctrl+tab"),
  "play_pause": lambda: keyboard.press_and_release("playpause"),
  "vol_up": lambda: keyboard.press_and_release("volumeup"),
  "vol_down": lambda: keyboard.press_and_release("volumedown"),
  "undo": lambda: keyboard.press_and_release("ctrl+z"),
  "close_tab": lambda: keyboard.press_and_release("ctrl+w"),
  "new_tab": lambda: keyboard.press_and_release("ctrl+t"),
  "open_youtube": lambda: webbrowser.open("https://youtube.com"),
  "open_github": lambda: webbrowser.open("https://github.com"),
  "switch_app_left": lambda: keyboard.press_and_release("alt+shift+tab"),
  "switch_app_right": lambda: keyboard.press_and_release("alt+tab"),
}

HOLD_GESTURES = {"INDEX_PINKY", "INDEX_RING"}
HOLD_DURATION = 0.4


def reload_mappings(self):
  self.load_mappings()
  print("[TRAE] Mappings reloaded.")


class TRAEWorkflowRouter:
  def __init__(self):
    self.current_mode = "BROWSER"
    self.last_action_times = {}

    self.latest_gesture = "None"
    self.latest_action = "None"
    self.action_display_time = 0

    self.load_mappings()

    self.hold_start_times = {}

  def load_mappings(self):
    try:
      with open("mappings.json", "r") as f:
        self.mappings = json.load(f)
    except FileNotFoundError:
      print("WARNING: mappings.json not found.")
      self.mappings = {"BROWSER": {}}

  def _focus_browser(self):
    try:
      if platform.system() == "Darwin":
        subprocess.run(["osascript", "-e",
                        'tell application "Google Chrome" to activate'],
                       capture_output=True)
      elif platform.system() == "Windows":
        import pygetwindow as gw
        wins = gw.getWindowsWithTitle("Chrome")
        if wins:
          wins[0].activate()
    except Exception:
      pass

  def execute_action(self, gesture_name):
    now = time.time()

    # --- DYNAMIC TIMEOUTS ---
    cooldown = PER_GESTURE_COOLDOWN
    if gesture_name == "OPEN_PALM":
      cooldown = OPEN_PALM_COOLDOWN
    elif "SCROLL" in gesture_name:
      cooldown = SCROLL_COOLDOWN
    elif "WHOLE_HAND_SWIPE" in gesture_name:
      cooldown = 1.2  # LONG TIMEOUT: Prevents accidental app-switch spamming
    elif "SWIPE" in gesture_name:
      cooldown = 0.8  # MEDIUM TIMEOUT: Prevents accidental tab-switch spamming

    if now - self.last_action_times.get(gesture_name, 0) < cooldown:
      if gesture_name in HOLD_GESTURES:
        self.hold_start_times.pop(gesture_name, None)
      return

    if gesture_name in HOLD_GESTURES:
      if gesture_name not in self.hold_start_times:
        self.hold_start_times[gesture_name] = now
        print(f"[TRAE] Started holding: {gesture_name}")
        return
      elif now - self.hold_start_times[gesture_name] < HOLD_DURATION:
        return
      else:
        print(f"[TRAE] Hold complete: {gesture_name}")
        self.hold_start_times.pop(gesture_name)

    action_key = self.mappings.get(self.current_mode, {}).get(gesture_name)
    if action_key and action_key in ACTION_HANDLERS:
      if action_key in ["prev_tab", "next_tab"]:
        self._focus_browser()

      print(f"[TRAE] 🔥 EXECUTING: {gesture_name} → {action_key}")
      ACTION_HANDLERS[action_key]()
      self.last_action_times[gesture_name] = now
      self.latest_gesture = gesture_name
      self.latest_action = action_key
      self.action_display_time = now