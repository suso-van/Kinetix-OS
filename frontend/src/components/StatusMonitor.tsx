import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ControlMode, GestureLog } from '../types';
import { Video, VideoOff, Info, HelpCircle, Sparkles, Volume2, VolumeX, Hand, Touchpad, ArrowLeft, ArrowRight, Scissors, Fingerprint, RotateCw, Keyboard } from 'lucide-react';
import { GESTURES, DEFAULT_MAPPINGS, ACTION_OPTIONS } from '../data';

interface StatusMonitorProps {
  currentMode: ControlMode;
  logs: GestureLog[];
  onTriggerGestureSimulate: (gestureId: string) => void;
  activeTriggeredId: string | null;
  activeConfidence: number | null;
  activeGestureName: string | null;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

export default function StatusMonitor({
  currentMode,
  logs,
  onTriggerGestureSimulate,
  activeTriggeredId,
  activeConfidence,
  activeGestureName,
}: StatusMonitorProps) {
  // Tabs for interactive viewports: 'lidar' | 'sandbox'
  const [activeTab, setActiveTab] = useState<'sandbox' | 'lidar'>('sandbox');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Simulated skeletal dots loop coords
  const [skeutalCoords, setSkeletalCoords] = useState<{ x: number; y: number }[]>([]);
  const meshRef = useRef<HTMLCanvasElement | null>(null);

  // Sandbox Canvas reference
  const sandboxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sandboxIsDrawingRef = useRef(false);
  const sandboxPointsRef = useRef<{ x: number; y: number; time: number }[]>([]);
  const sandboxParticlesRef = useRef<Particle[]>([]);
  const [sandboxFeedbackText, setSandboxFeedbackText] = useState<string>('Drag or tap inside this pad to simulate hand choreography');

  // Trigger synthesized audio tones
  const playSynthTone = (type: 'hover' | 'confirm' | 'draw', frequencyMod = 1) => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'confirm') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380 * frequencyMod, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(760 * frequencyMod, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      } else if (type === 'hover') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(580 * frequencyMod, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900 * frequencyMod, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'draw') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180 + frequencyMod * 2, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(260 + frequencyMod, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (err) {
      console.warn('Audio Context is not initialized or allowed yet.', err);
    }
  };

  // Trigger synth whenever active mapping fires globally
  useEffect(() => {
    if (activeTriggeredId) {
      playSynthTone('confirm', 1.25);
    }
  }, [activeTriggeredId]);

  // Simulated LIDAR matrix scan particles
  useEffect(() => {
    let animationFrameId: number;
    let angle = 0;

    const generateHandCoordinates = () => {
      // Create a floating cyber hand skeleton moving in natural parametric loops
      angle += 0.02;
      const baseHlx = 100 + Math.sin(angle) * 30;
      const baseHly = 90 + Math.cos(angle * 1.5) * 15;

      const joints = [
        { x: baseHlx, y: baseHly }, // palm root
        { x: baseHlx - 15, y: baseHly - 10 }, // thumb joint
        { x: baseHlx - 25, y: baseHly - 18 }, // thumb tip
        { x: baseHlx - 5, y: baseHly - 25 }, // index root
        { x: baseHlx - 8, y: baseHly - 45 }, // index tip
        { x: baseHlx + 8, y: baseHly - 25 }, // middle root
        { x: baseHlx + 10, y: baseHly - 48 }, // middle tip
        { x: baseHlx + 18, y: baseHly - 22 }, // ring root
        { x: baseHlx + 22, y: baseHly - 42 }, // ring tip
        { x: baseHlx + 28, y: baseHly - 18 }, // pinky root
        { x: baseHlx + 34, y: baseHly - 32 }, // pinky tip
      ];
      setSkeletalCoords(joints);
    };

    const interval = setInterval(generateHandCoordinates, 40);

    const canvas = meshRef.current;
    if (canvas && activeTab === 'lidar') {
      const qc = canvas.getContext('2d');
      if (qc) {
        let frame = 0;
        const render = () => {
          frame++;
          qc.clearRect(0, 0, canvas.width, canvas.height);

          // Draw biometric wire grid
          qc.strokeStyle = 'rgba(32, 178, 170, 0.05)';
          qc.lineWidth = 1;
          const gridSize = 20;
          for (let x = 0; x < canvas.width; x += gridSize) {
            qc.beginPath();
            qc.moveTo(x, 0);
            qc.lineTo(x, canvas.height);
            qc.stroke();
          }
          for (let y = 0; y < canvas.height; y += gridSize) {
            qc.beginPath();
            qc.moveTo(0, y);
            qc.lineTo(canvas.width, y);
            qc.stroke();
          }

          // Concentric biometric ripples
          qc.strokeStyle = 'rgba(127, 255, 212, 0.08)';
          qc.beginPath();
          qc.arc(canvas.width / 2, canvas.height / 2, (frame * 1.5) % (canvas.width / 1.5), 0, Math.PI * 2);
          qc.stroke();

          // Draw the cyber skeletal hand
          if (skeutalCoords.length > 0) {
            qc.strokeStyle = activeTriggeredId ? 'rgba(16, 185, 129, 0.6)' : 'rgba(32, 178, 170, 0.45)';
            qc.lineWidth = 1.8;
            qc.shadowBlur = 12;
            qc.shadowColor = activeTriggeredId ? '#10b981' : '#20b2aa';

            // Palm root connection
            qc.beginPath();
            qc.moveTo(skeutalCoords[0].x, skeutalCoords[0].y);
            qc.lineTo(skeutalCoords[1].x, skeutalCoords[1].y);
            qc.lineTo(skeutalCoords[2].x, skeutalCoords[2].y);
            qc.stroke();

            for (let i = 3; i < skeutalCoords.length; i += 2) {
              qc.beginPath();
              qc.moveTo(skeutalCoords[0].x, skeutalCoords[0].y);
              qc.lineTo(skeutalCoords[i].x, skeutalCoords[i].y);
              qc.lineTo(skeutalCoords[i + 1].x, skeutalCoords[i + 1].y);
              qc.stroke();
            }

            // Glow nodes
            qc.shadowBlur = 0;
            skeutalCoords.forEach((dot, idx) => {
              qc.fillStyle = activeTriggeredId ? '#10b981' : idx === 4 ? '#7fffd4' : 'rgba(32, 178, 170, 0.9)';
              qc.beginPath();
              qc.arc(dot.x, dot.y, idx === 0 ? 5.5 : 3.8, 0, Math.PI * 2);
              qc.fill();
            });
          }

          animationFrameId = requestAnimationFrame(render);
        };
        animationFrameId = requestAnimationFrame(render);
      }
    }

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animationFrameId);
    };
  }, [skeutalCoords, activeTriggeredId, activeTab]);

  // Handle webcam toggle
  const toggleCamera = async () => {
    if (cameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      streamRef.current = null;
      setCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
        setCameraActive(true);
        setActiveTab('lidar'); // Auto focus on lidar tab if camera active
      } catch (err) {
        setSandboxFeedbackText('Camera unavailable. Enjoying simulated biometric sandbox.');
        console.warn('Camera failed:', err);
      }
    }
  };

  // Sandbox drag start
  const handleSandboxMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sandboxCanvasRef.current;
    if (!canvas) return;

    sandboxIsDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    sandboxPointsRef.current = [{ x, y, time: Date.now() }];
    setSandboxFeedbackText('Analyzing motion path vectors...');
    playSynthTone('hover', 0.8);

    // Initial injection of drag coordinates particles
    for (let i = 0; i < 6; i++) {
      sandboxParticlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: Math.random() * 3 + 2,
        color: '#7FFFD4',
        alpha: 1.0,
      });
    }
  };

  // Sandbox drag move
  const handleSandboxMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!sandboxIsDrawingRef.current) return;
    const canvas = sandboxCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    sandboxPointsRef.current.push({ x, y, time: Date.now() });

    // Play drawing hum dynamically keyed to client coordinates
    playSynthTone('draw', x / 2);

    // Add trailing glowing bioluminescent particles
    if (Math.random() > 0.3) {
      sandboxParticlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 4 + 1.5,
        color: Math.random() > 0.4 ? '#20B2AA' : '#10B981',
        alpha: 1.0,
      });
    }
  };

  // Sandbox drag end with vector heuristics parsing
  const handleSandboxMouseUpOrLeave = () => {
    if (!sandboxIsDrawingRef.current) return;
    sandboxIsDrawingRef.current = false;

    const points = sandboxPointsRef.current;
    if (points.length < 3) {
      setSandboxFeedbackText('Touch stabilized. Double Click or Drag fast to dispatch sweeps.');
      return;
    }

    const first = points[0];
    const last = points[points.length - 1];
    const dx = last.x - first.x;
    const dy = last.y - first.y;
    const dt = last.time - first.time;

    // Detect gesture patterns
    if (dt < 280 && Math.abs(dx) < 20 && Math.abs(dy) < 20) {
      // Short tap
      setSandboxFeedbackText('Simulated Double Tap command triggered!');
      onTriggerGestureSimulate('double_tap');
      return;
    }

    // Swipes
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 45) {
        setSandboxFeedbackText('Detected linear swipe from auxiliary left to Right!');
        onTriggerGestureSimulate('swipe_right');
      } else if (dx < -45) {
        setSandboxFeedbackText('Detected linear swipe from auxiliary right to Left!');
        onTriggerGestureSimulate('swipe_left');
      } else {
        setSandboxFeedbackText('Insufficient velocity. Pull or sweep wider.');
      }
    } else {
      if (dy > 45) {
        setSandboxFeedbackText('Simulating deep Palm Hold spatial mesh Lock.');
        onTriggerGestureSimulate('palm_hold');
      } else if (dy < -45) {
        setSandboxFeedbackText('Simulating index Pinch gesture action upwards.');
        onTriggerGestureSimulate('pinch');
      } else {
        setSandboxFeedbackText('Synaptic calibration loop stabilized.');
      }
    }

    // Check for circular loop
    if (points.length > 8) {
      let turns = 0;
      for (let i = 2; i < points.length; i++) {
        const v1 = { x: points[i - 1].x - points[i - 2].x, y: points[i - 1].y - points[i - 2].y };
        const v2 = { x: points[i].x - points[i - 1].x, y: points[i].y - points[i - 1].y };
        const cross = v1.x * v2.y - v1.y * v2.x;
        turns += cross;
      }
      if (Math.abs(turns) > 2800) {
        setSandboxFeedbackText('Detected high-eccentricity concentric Circle loop!');
        onTriggerGestureSimulate('circular_motion');
      }
    }
  };

  // Particle render loop inside sandbox
  useEffect(() => {
    const canvas = sandboxCanvasRef.current;
    if (!canvas || activeTab !== 'sandbox') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle ambient trackpad markings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;

      // Draw horizontal crosshairs
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();

      // Golden ratio circle indicators in center of sandbox pad
      ctx.strokeStyle = 'rgba(32, 178, 170, 0.08)';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 45, 0, Math.PI * 2);
      ctx.stroke();

      // Render drawing points queue with line interpolation
      if (sandboxIsDrawingRef.current && sandboxPointsRef.current.length > 1) {
        ctx.strokeStyle = 'rgba(127, 255, 212, 0.8)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(sandboxPointsRef.current[0].x, sandboxPointsRef.current[0].y);
        for (let i = 1; i < sandboxPointsRef.current.length; i++) {
          ctx.lineTo(sandboxPointsRef.current[i].x, sandboxPointsRef.current[i].y);
        }
        ctx.stroke();
      }

      // Update and draw particles list
      const particles = sandboxParticlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.024;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [activeTab]);

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div id="status-monitor-hud" className="space-y-6">
      {/* 1. Interactive Core Sandbox & Lidar Viewport */}
      <div className="border border-white/10 bg-white/[0.03] backdrop-blur-xl rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] overflow-hidden relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1.5 font-display font-medium text-xs tracking-wide">
            <span className="h-2 w-2 rounded-full bg-aquamarine-accent animate-pulse"></span>
            <span className="text-white font-bold uppercase tracking-wider">Tactile Synergy Sandbox</span>
          </div>

          {/* Subheader Switch tabs for sandbox drawing pad vs lidar simulation */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/5 self-start sm:self-auto">
            <button
              id="tab-sandbox-sel"
              onClick={() => {
                setActiveTab('sandbox');
                playSynthTone('hover', 0.95);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all uppercase cursor-pointer ${
                activeTab === 'sandbox'
                  ? 'bg-[#20b2aa]/15 text-aquamarine-accent font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Touchpad className="w-3.5 h-3.5" />
              <span>Interactive Pad</span>
            </button>
            <button
              id="tab-lidar-sel"
              onClick={() => {
                setActiveTab('lidar');
                playSynthTone('hover', 1.05);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all uppercase cursor-pointer ${
                activeTab === 'lidar'
                  ? 'bg-[#20b2aa]/15 text-aquamarine-accent font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              <span>Simulated Lidar</span>
            </button>
          </div>
        </div>

        {/* Dynamic Sandbox Frame Area */}
        <div className="relative aspect-[4/3] rounded-2.5xl overflow-hidden bg-slate-950/90 border border-[#20b2aa]/30 shadow-inner group">
          
          {/* Active Interactive Trackpad Screen */}
          {activeTab === 'sandbox' && (
            <div className="absolute inset-0 w-full h-full flex flex-col z-10 transition-all">
              <canvas
                id="sandbox-drawing-canvas"
                ref={sandboxCanvasRef}
                width={360}
                height={270}
                onMouseDown={handleSandboxMouseDown}
                onMouseMove={handleSandboxMouseMove}
                onMouseUp={handleSandboxMouseUpOrLeave}
                onMouseLeave={handleSandboxMouseUpOrLeave}
                className="absolute inset-0 w-full h-full cursor-crosshair z-10"
              />
              {/* Informative text floating overlay inside the tactile drawing block */}
              <div className="absolute top-3 left-3 pointer-events-none z-20 font-mono text-[9.5px] bg-[#0b1424]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5 text-slate-300 max-w-[280px]">
                <div className="flex items-center gap-1.5 text-aquamarine-accent mb-1 font-bold">
                  <Sparkles className="w-3 h-3 text-[#7FFFD4]" />
                  <span>GESTURE DRAWS ENABLED</span>
                </div>
                <span>{sandboxFeedbackText}</span>
              </div>

              {/* Grid guide */}
              <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none opacity-20">
                {Array.from({ length: 16 }).map((_, idx) => (
                  <div key={idx} className="border border-[#20b2aa]/10" />
                ))}
              </div>

              <div className="absolute bottom-3 right-3 pointer-events-none z-20 font-mono text-[9px] bg-[#0b1424]/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#20b2aa]/10 text-[#7FFFD4] uppercase text-xs">
                Drag fast L/R to Swipe
              </div>
            </div>
          )}

          {/* Simulated Lidar skeletal mesh */}
          {activeTab === 'lidar' && (
            <div className="absolute inset-0 w-full h-full z-10">
              {/* Webcam Element if active */}
              {cameraActive && (
                <video
                  id="webcam-viewer"
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover opacity-60 scale-x-[-1]"
                />
              )}

              {/* Matrix canvas skeleton on top */}
              <canvas
                id="lidar-mesh-canvas"
                ref={meshRef}
                width={320}
                height={240}
                className="absolute inset-0 w-full h-full pointer-events-none z-10 scale-x-[-1]"
              />

              {/* Glowing hud scan elements */}
              <div className="absolute top-3 left-3 z-10 font-mono text-[9.5px] bg-[#0b1424]/80 backdrop-blur-md p-2 rounded-xl border border-white/5 text-slate-300 space-y-0.5">
                <div>
                  <span className="text-sea-green">FPS:</span> 60.00
                </div>
                <div>
                  <span className="text-sea-green">LATENCY:</span> {activeTriggeredId ? '14' : '23'} ms
                </div>
                <div>
                  <span className="text-sea-green">FOV:</span> 120° HYPERSPECT
                </div>
                <div>
                  <span className="text-[#10B981]">MATRICES:</span> 25-point mesh
                </div>
              </div>

              <div className="absolute bottom-3 right-3 z-10 font-mono text-[9.5px] bg-[#0b1424]/80 backdrop-blur-md p-2 rounded-xl border border-white/5 text-slate-300">
                <span className="text-aquamarine-accent font-bold uppercase">
                  {activeTriggeredId ? '⚡ GESTURE CONFIRMED' : '● SKELETAL STANDBY'}
                </span>
              </div>

              <div className="absolute top-3 right-3 z-10 flex gap-2 items-center">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-[9px] font-mono text-red-500 font-bold tracking-widest uppercase">REC Feed</span>
              </div>
            </div>
          )}

          {/* Toggle camera button for webcam */}
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5">
            <button
              id="camera-toggle-btn"
              onClick={toggleCamera}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono border transition-all duration-300 cursor-pointer ${
                cameraActive
                  ? 'bg-emerald-active/10 border-emerald-active text-emerald-active hover:bg-emerald-active/20'
                  : 'bg-white/[0.05] backdrop-blur-md border-[#20b2aa]/30 text-sea-green hover:border-[#20b2aa]/50 hover:bg-white/[0.1]'
              }`}
            >
              {cameraActive ? (
                <>
                  <Video className="w-3.5 h-3.5 text-emerald-active" />
                  <span>WEBCAM ON</span>
                </>
              ) : (
                <>
                  <VideoOff className="w-3.5 h-3.5 text-sea-green" />
                  <span>ENABLE CAMERA</span>
                </>
              )}
            </button>

            {/* Futuristic Synth sound FX controller */}
            <button
              id="synth-sound-btn"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                playSynthTone('hover', 1.15);
              }}
              className={`p-2 rounded-xl border transition-all duration-300 cursor-pointer ${
                soundEnabled
                  ? 'bg-[#20B2AA]/10 border-[#20B2AA]/30 text-[#7FFFD4]'
                  : 'bg-black/35 border-transparent text-slate-500'
              }`}
              title={soundEnabled ? 'Disable Synthesizer Audio response' : 'Enable Synthesizer Audio response'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. THE STATUS LIVE FEEDBACK ORB & INTEGRATED SIMULATION SHORTCUTS */}
      <div className="border border-white/10 bg-white/[0.03] backdrop-blur-xl rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] relative flex flex-col overflow-hidden">
        {/* Dynamic ambient colored backgrounds inside the glowing energy mesh */}
        <div className="absolute w-[260px] h-[260px] bg-[#20B2AA]/10 rounded-full blur-[80px] animate-pulse pointer-events-none z-0"></div>
        <div className="absolute w-[180px] h-[180px] bg-[#10B981]/5 rounded-full blur-[60px] pointer-events-none z-0"></div>

        {/* Global Combined Header */}
        <div className="w-full flex items-center justify-between border-b border-white/5 pb-3 mb-4 relative z-10 select-none">
          <h4 className="text-[10px] font-mono text-slate-300 uppercase tracking-[0.2em] font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#7FFFD4]" />
            Simulation & Resonance Engine
          </h4>
          <span className="text-[8.5px] font-mono text-[#7FFFD4] font-bold uppercase tracking-widest bg-[#20b2aa]/15 border border-[#20b2aa]/30 px-2 py-0.5 rounded-lg">
            {currentMode} Mode
          </span>
        </div>

        {/* Upper Subsection: Resonance Orb & Live Ticker Side-by-Side */}
        <div className="flex flex-row items-center gap-5 relative z-10">
          {/* The compact Live Feedback Orb */}
          <div id="energy-orb-container" className="relative w-28 h-28 flex items-center justify-center shrink-0 select-none">
            <div className="relative flex items-center justify-center">
              {/* Background glass container with inner shadow */}
              <div className="w-24 h-24 rounded-full border border-[#20B2AA]/30 flex items-center justify-center bg-white/[0.02] backdrop-blur-xl shadow-[inset_0_0_20px_rgba(32,178,170,0.25)]">
                {/* Glowing spinning ring */}
                <motion.div
                  className="absolute w-20 h-20 rounded-full border-2 border-[#7FFFD4]/50 border-t-transparent pointer-events-none"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                />

                <div className="absolute flex flex-col items-center">
                  <span className="text-[9px] font-bold tracking-[0.2em] text-[#7FFFD4] opacity-85 uppercase">
                    {activeTriggeredId ? 'READY' : 'SCAN'}
                  </span>
                  <span className="text-xl font-black text-white mt-0.5 italic tracking-tight font-display">
                    {activeConfidence ? `${activeConfidence}%` : '98.4%'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Feedback info text next to the spinning orb */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {activeTriggeredId ? (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-1"
                >
                  <span className="inline-block text-[9px] font-mono tracking-widest text-[#10B981] font-bold uppercase py-0.5 px-2 rounded bg-[#10b981]/15 border border-[#10b981]/35">
                    Trigger Active
                  </span>
                  <p className="text-xs font-mono text-emerald-active font-bold italic tracking-wide truncate">
                    ⚡ {activeGestureName || 'Gesture'} Connected
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Calibration dispatch synced in {activeTriggeredId ? '14' : '23'}ms
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-1"
                >
                  <span className="inline-block text-[9px] font-mono tracking-widest text-[#20b2aa] font-bold uppercase py-0.5 px-2 bg-[#20b2aa]/10 border border-[#20b2aa]/25 rounded">
                    Biometric Link
                  </span>
                  <p className="text-xs text-slate-300 font-mono italic">
                    Waiting for coordinate gesture synapse triggers...
                  </p>
                  <p className="text-[9.5px] text-slate-500 font-mono">
                    Try using keyboard shortcuts S, D, P, T, H, C or click the pads below.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Divider line between Orb monitor and Simulation pads */}
        <div className="w-full h-[1px] bg-white/5 my-4 z-10 relative"></div>

        {/* Lower Subsection: Biometric Quick-Simulate pads */}
        <div className="space-y-3 relative z-10 select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Keyboard className="w-3.5 h-3.5 text-aquamarine-accent" />
              Interactive Simulation Synapes
            </span>
            <span className="text-[9px] text-slate-500 font-mono">Click to Trigger Feed</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {GESTURES.map((gesture) => {
              // Find dynamic active action mapping
              const activeModeMappings = DEFAULT_MAPPINGS[currentMode];
              const mapped = activeModeMappings.find((m) => m.gestureId === gesture.id);
              const mappedAction = ACTION_OPTIONS.find((a) => a.id === mapped?.actionId);
              const mappedActionLabel = mapped?.isActive 
                ? (mappedAction ? mappedAction.name : 'Unknown Action')
                : 'Deactivated node';

              const helperIcon = (() => {
                switch (gesture.id) {
                  case 'swipe_left': return <ArrowLeft className="w-3.5 h-3.5" />;
                  case 'swipe_right': return <ArrowRight className="w-3.5 h-3.5" />;
                  case 'pinch': return <Scissors className="w-3.5 h-3.5" />;
                  case 'double_tap': return <Fingerprint className="w-3.5 h-3.5" />;
                  case 'palm_hold': return <Hand className="w-3.5 h-3.5" />;
                  case 'circular_motion': return <RotateCw className="w-3.5 h-3.5" />;
                  default: return <Sparkles className="w-3.5 h-3.5" />;
                }
              })();

              const kbdKey = (() => {
                switch (gesture.id) {
                  case 'swipe_left': return 'S';
                  case 'swipe_right': return 'D';
                  case 'pinch': return 'P';
                  case 'double_tap': return 'T';
                  case 'palm_hold': return 'H';
                  case 'circular_motion': return 'C';
                  default: return '';
                }
              })();

              return (
                <button
                  key={gesture.id}
                  onClick={() => {
                    onTriggerGestureSimulate(gesture.id);
                    // play drawing confirmation tone
                    if (typeof playSynthTone === 'function') {
                      playSynthTone('confirm');
                    }
                  }}
                  className={`group relative text-left bg-white/[0.02] border border-white/5 hover:border-[#20b2aa]/40 hover:bg-[#20b2aa]/5 p-2.5 rounded-2xl transition-all duration-300 w-full cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#7FFFD4]/30`}
                  title={`Simulate ${gesture.name} gesture`}
                >
                  <div className="flex items-start gap-2 h-full min-w-0">
                    <div className="p-1.5 rounded-xl bg-white/5 text-[#7FFFD4] group-hover:bg-[#20b2aa]/25 group-hover:scale-105 transition-all duration-300 shrink-0">
                      {helperIcon}
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col justify-between h-full space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                          {gesture.name}
                        </span>
                        {kbdKey && (
                          <kbd className="px-1.5 py-0.25 rounded bg-[#0b1424]/90 border border-white/10 text-[8px] font-bold font-mono text-slate-400 group-hover:text-white group-hover:border-[#7FFFD4]/40 transition-all shadow-sm shrink-0">
                            {kbdKey}
                          </kbd>
                        )}
                      </div>

                      <div className="text-[9px] text-slate-400 truncate font-mono">
                        Mapped To: <span className="text-[#7FFFD4] font-medium block truncate mt-0.5">{mappedActionLabel}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. LIVE EVENT LOGGER / FEEDBACK TICKER */}
      <div className="border border-white/10 bg-white/[0.03] backdrop-blur-xl rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <h4 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <span>📊</span> Telemetry Log Ticker
          </h4>
          <span className="text-[10px] font-mono text-slate-400 font-semibold">{logs.length} detected</span>
        </div>

        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
          {logs.length === 0 ? (
            <p className="text-[11px] text-slate-500 text-center py-4 font-mono italic">No tracking entries recorded.</p>
          ) : (
            <AnimatePresence initial={false}>
              {logs.map((log) => (
                <motion.div
                  id={`log-entry-${log.id}`}
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-2.5 rounded-xl bg-slate-950/45 border border-white/5 flex items-center justify-between gap-1 text-[11px] font-mono hover:bg-slate-900/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                    <span className="text-aquamarine-accent font-semibold truncate italic">
                      *{log.gestureName}*
                    </span>
                    <span className="text-slate-400">➔</span>
                    <span className="text-white font-medium truncate">{log.actionName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-right">
                    <span className="text-sea-green font-bold text-[10px]">{log.confidence}%</span>
                    <span className="text-slate-500 font-bold">|</span>
                    <span className="text-slate-500 text-[9px]">{log.latencyMs}ms</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
