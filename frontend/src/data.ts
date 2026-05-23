import { Gesture, ActionOption, GestureMapping } from './types';

export const TUNES = [
  { title: 'Bioluminescent Bloom', artist: 'Scylla & Charybda', duration: '3:45' },
  { title: 'Sub-aquatic Pressure', artist: 'Hologram Grid', duration: '4:12' },
  { title: 'Space Grotesk Synapse', artist: 'Kinetix Ambient', duration: '2:50' },
];

export const GESTURES: Gesture[] = [
  {
    id: 'swipe_left',
    name: 'Swipe Left',
    iconName: 'ArrowLeft',
    description: 'Quick hand stroke from right to left in camera viewfinder.',
    category: 'motion',
  },
  {
    id: 'swipe_right',
    name: 'Swipe Right',
    iconName: 'ArrowRight',
    description: 'Quick hand stroke from left to right in camera viewfinder.',
    category: 'motion',
  },
  {
    id: 'pinch',
    name: 'Pinch Air',
    iconName: 'Scissors',
    description: 'Hold thumb and index finger together in a pincers clamp.',
    category: 'finger',
  },
  {
    id: 'double_tap',
    name: 'Double Tap',
    iconName: 'Fingerprint',
    description: 'Rapid double air-tap using your prominent index finger.',
    category: 'finger',
  },
  {
    id: 'palm_hold',
    name: 'Palm Hold',
    iconName: 'Hand',
    description: 'Raise your open hand facing the camera, pausing for 1.2s.',
    category: 'palm',
  },
  {
    id: 'circular_motion',
    name: 'Circular Clockwise',
    iconName: 'RotateCw',
    description: 'Draw a circle clockwise with an index finger in midair.',
    category: 'motion',
  },
];

export const ACTION_OPTIONS: ActionOption[] = [
  // Browser Mode Actions
  {
    id: 'tab_prev',
    name: 'Previous Browser Tab',
    category: 'Browser',
    iconName: 'ChevronsLeft',
    description: 'Switches back to the adjacent tab on the left.',
  },
  {
    id: 'tab_next',
    name: 'Next Browser Tab',
    category: 'Browser',
    iconName: 'ChevronsRight',
    description: 'Switches over to the adjacent tab on the right.',
  },
  {
    id: 'scroll_down',
    name: 'Smooth Scroll Down',
    category: 'Browser',
    iconName: 'ArrowDown',
    description: 'Scrolls active viewport down by a fixed vertical chunk.',
  },
  {
    id: 'scroll_up',
    name: 'Smooth Scroll Up',
    category: 'Browser',
    iconName: 'ArrowUp',
    description: 'Scrolls active viewport up by a fixed vertical chunk.',
  },
  {
    id: 'refresh_page',
    name: 'Reload Active Page',
    category: 'Browser',
    iconName: 'RefreshCw',
    description: 'Fires command to reload database content and view.',
  },

  // Media Mode Actions
  {
    id: 'play_pause',
    name: 'Toggle Play/Pause',
    category: 'Media',
    iconName: 'PlayPause',
    description: 'Starts or pauses current stream dynamically.',
  },
  {
    id: 'skip_next',
    name: 'Skip to Next Track',
    category: 'Media',
    iconName: 'SkipForward',
    description: 'Instructs music stack to slide to next audio item.',
  },
  {
    id: 'volume_up',
    name: 'Raise Master Volume',
    category: 'Media',
    iconName: 'Volume2',
    description: 'Increases output sound amplitude in 10% steps.',
  },
  {
    id: 'volume_down',
    name: 'Lower Master Volume',
    category: 'Media',
    iconName: 'Volume1',
    description: 'Decreases output sound amplitude in 10% steps.',
  },
  {
    id: 'mute_toggle',
    name: 'Toggle Audio Mute',
    category: 'Media',
    iconName: 'VolumeX',
    description: 'Mutes all system volumes instantaneously with indicator colors.',
  },

  // Core System Actions
  {
    id: 'open_launcher',
    name: 'Show Radial HUD',
    category: 'Core',
    iconName: 'Grid',
    description: 'Launches or pulls back global system control panel.',
  },
  {
    id: 'system_sleep',
    name: 'Lock Screen Session',
    category: 'Core',
    iconName: 'Lock',
    description: 'Immediately locks local terminal and blurs workspace.',
  },
  {
    id: 'ai_command',
    name: 'Invoke Gemini Core AI',
    category: 'Core',
    iconName: 'Sparkles',
    description: 'Summons ambient server-side assistant to listen for speech context.',
  },
  {
    id: 'toggle_hud',
    name: 'Toggle System Console',
    category: 'Core',
    iconName: 'Terminal',
    description: 'Switches development spatial metrics feed on-screen.',
  },
];

// Default configurations
export const DEFAULT_MAPPINGS: Record<'Browser' | 'Media' | 'Core', GestureMapping[]> = {
  Browser: [
    { id: 'b_m1', gestureId: 'swipe_left', actionId: 'tab_prev', isActive: true, sensitivity: 75, timesTriggered: 12 },
    { id: 'b_m2', gestureId: 'swipe_right', actionId: 'tab_next', isActive: true, sensitivity: 80, timesTriggered: 24 },
    { id: 'b_m3', gestureId: 'pinch', actionId: 'scroll_down', isActive: true, sensitivity: 60, timesTriggered: 8 },
    { id: 'b_m4', gestureId: 'double_tap', actionId: 'refresh_page', isActive: true, sensitivity: 90, timesTriggered: 3 },
    { id: 'b_m5', gestureId: 'palm_hold', actionId: 'scroll_up', isActive: true, sensitivity: 50, timesTriggered: 0 },
    { id: 'b_m6', gestureId: 'circular_motion', actionId: 'ai_command', isActive: false, sensitivity: 85, timesTriggered: 0 },
  ],
  Media: [
    { id: 'm_m1', gestureId: 'swipe_left', actionId: 'volume_down', isActive: true, sensitivity: 70, timesTriggered: 45 },
    { id: 'm_m2', gestureId: 'swipe_right', actionId: 'volume_up', isActive: true, sensitivity: 70, timesTriggered: 50 },
    { id: 'm_m3', gestureId: 'pinch', actionId: 'play_pause', isActive: true, sensitivity: 75, timesTriggered: 89 },
    { id: 'm_m4', gestureId: 'double_tap', actionId: 'skip_next', isActive: true, sensitivity: 85, timesTriggered: 18 },
    { id: 'm_m5', gestureId: 'palm_hold', actionId: 'mute_toggle', isActive: true, sensitivity: 50, timesTriggered: 2 },
    { id: 'm_m6', gestureId: 'circular_motion', actionId: 'open_launcher', isActive: true, sensitivity: 90, timesTriggered: 7 },
  ],
  Core: [
    { id: 'c_m1', gestureId: 'swipe_left', actionId: 'system_sleep', isActive: true, sensitivity: 85, timesTriggered: 4 },
    { id: 'c_m2', gestureId: 'swipe_right', actionId: 'open_launcher', isActive: true, sensitivity: 80, timesTriggered: 32 },
    { id: 'c_m3', gestureId: 'pinch', actionId: 'ai_command', isActive: true, sensitivity: 65, timesTriggered: 41 },
    { id: 'c_m4', gestureId: 'double_tap', actionId: 'toggle_hud', isActive: true, sensitivity: 95, timesTriggered: 104 },
    { id: 'c_m5', gestureId: 'palm_hold', actionId: 'system_sleep', isActive: false, sensitivity: 50, timesTriggered: 0 },
    { id: 'c_m6', gestureId: 'circular_motion', actionId: 'ai_command', isActive: true, sensitivity: 90, timesTriggered: 15 },
  ],
};
