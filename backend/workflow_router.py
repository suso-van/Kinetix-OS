# workflow_router.py
import time
import pyautogui
import keyboard
import webbrowser
import json
import os
import subprocess
from config import FIST_HOLD_DURATION, PER_GESTURE_COOLDOWN
from gestures import detect_fist

# Centralized action implementations
ACTION_HANDLERS = {
  "click": lambda: pyautogui.click(),
  "scroll_up": lambda: pyautogui.scroll(80),  # May need to tweak for macOS natural scrolling
  "scroll_down": lambda: pyautogui.scroll(-80),
  "open_youtube": lambda: webbrowser.open("https://youtube.com"),

  # Browser shortcuts (Updated for macOS Command keys)
  "browser_back": lambda: pyautogui.hotkey("command", "left"),
  "browser_forward": lambda: pyautogui.hotkey("command", "right"),

  # Media controls
  "play_pause": lambda: pyautogui.press("playpause"),
  "volume_up": lambda: pyautogui.press("volumeup"),
  "volume_down": lambda: pyautogui.press("volumedown"),
  "next_track": lambda: pyautogui.press("nexttrack"),
  "prev_track": lambda: pyautogui.press("prevtrack"),

  # Zoom/Doctor shortcuts
  "zoom_in": lambda: pyautogui.hotkey("command", "+"),
  "zoom_out": lambda: pyautogui.hotkey("command", "-"),
  "open_patient_pdf": lambda: print("MOCK: Opening John_Doe_MRI_Report.pdf"),
  "prev_mri": lambda: pyautogui.press("left"),
  "next_mri": lambda: pyautogui.press("right"),
}


class TRAEWorkflowRouter:
  def __init__(self):
    self.current_mode = "BROWSER"
    self.fist_start_time = None
    self.last_action_times = {}  # Per-gesture cooldowns

    # UI State variables
    self.latest_gesture = "None"
    self.latest_action = "None"
    self.action_display_time = 0

    self.load_mappings()
    self.MODES = list(self.mappings.keys())

  def load_mappings(self):
    try:
      with open("mappings.json", "r") as f:
        self.mappings = json.load(f)
    except FileNotFoundError:
      print("WARNING: mappings.json not found. Router disabled.")
      self.mappings = {"BROWSER": {}}

  def execute_action(self, gesture_name):
    now = time.time()
    # Per-gesture cooldown check
    if now - self.last_action_times.get(gesture_name, 0) < PER_GESTURE_COOLDOWN:
      return

    action_key = self.mappings.get(self.current_mode, {}).get(gesture_name)
    if action_key and action_key in ACTION_HANDLERS:
      ACTION_HANDLERS[action_key]()
      self.last_action_times[gesture_name] = now

      # Update state for UI overlays
      self.latest_gesture = gesture_name
      self.latest_action = action_key
      self.action_display_time = now
      print(f"[TRAE: {self.current_mode}] Executed {action_key} via {gesture_name}")

  def handle_mode_switch(self, pixel_landmarks):
    if detect_fist(pixel_landmarks):
      if self.fist_start_time is None:
        self.fist_start_time = time.time()
      elif time.time() - self.fist_start_time >= FIST_HOLD_DURATION:
        idx = (self.MODES.index(self.current_mode) + 1) % len(self.MODES)
        self.current_mode = self.MODES[idx]
        print(f"TRAE ROUTED → {self.current_mode} WORKFLOW")
        self.fist_start_time = None
        self.last_action_times.clear()  # Reset cooldowns on switch
    else:
      self.fist_start_time = None