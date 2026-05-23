export interface Gesture {
  id: string;
  name: string;
  iconName: string; // Lucide icon identifier
  description: string;
  category: 'motion' | 'finger' | 'palm';
}

export interface ActionOption {
  id: string;
  name: string;
  category: 'Browser' | 'Media' | 'Core';
  iconName: string; // Lucide icon identifier
  description: string;
}

export interface GestureMapping {
  id: string;
  gestureId: string;
  actionId: string;
  isActive: boolean;
  sensitivity: number; // 0 to 100
  timesTriggered: number;
}

export type ControlMode = 'Browser' | 'Media' | 'Core';

export interface GestureLog {
  id: string;
  timestamp: string;
  gestureId: string;
  gestureName: string;
  actionName: string;
  confidence: number; // between 80% and 99%
  mode: ControlMode;
  latencyMs: number; // between 10ms and 50ms
}
