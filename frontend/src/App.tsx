import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { GESTURES, ACTION_OPTIONS, DEFAULT_MAPPINGS, TUNES } from './data';
import { GestureMapping, GestureLog, ControlMode, Gesture } from './types';
import ModeIsland from './components/ModeIsland';
import MappingCanvas from './components/MappingCanvas';
import StatusMonitor from './components/StatusMonitor';
import ActionFeedbackOverlay from './components/ActionFeedbackOverlay';
import CustomMappingModal from './components/CustomMappingModal';
import LucideIcon from './components/LucideIcon';
import ShaderBackground from './components/ui/shader-background';
import { HelpCircle, Sliders, RefreshCw, Sparkles, Activity, Plus, RotateCcw, Monitor, Settings, Code, Info, Compass, PlayCircle, Cpu } from 'lucide-react';

export default function App() {
  // Mode selection state
  const [currentMode, setCurrentMode] = useState<ControlMode>('Browser');
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (!loading) return;
    
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const step = Math.floor(Math.random() * 8) + 4;
        return Math.min(prev + step, 100);
      });
    }, 120);

    return () => clearInterval(interval);
  }, [loading]);

  // Mappings state initialized from default data
  const [mappings, setMappings] = useState<Record<ControlMode, GestureMapping[]>>(DEFAULT_MAPPINGS);

  // Event telemetry logs state
  const [logs, setLogs] = useState<GestureLog[]>([
    {
      id: 'init_1',
      timestamp: '06:31:02',
      gestureId: 'palm_hold',
      gestureName: 'Palm Hold',
      actionName: 'Welcome Sequence Initialize',
      confidence: 99,
      mode: 'Browser',
      latencyMs: 12,
    },
    {
      id: 'init_2',
      timestamp: '06:33:14',
      gestureId: 'pinch',
      gestureName: 'Pinch Air',
      actionName: 'Smooth Scroll Down',
      confidence: 96,
      mode: 'Browser',
      latencyMs: 18,
    },
  ]);

  // Sensory connection status
  const [sensorConnected, setSensorConnected] = useState(true);

  // Active trigger flashing states
  const [activeTriggeredId, setActiveTriggeredId] = useState<string | null>(null);
  const [activeConfidence, setActiveConfidence] = useState<number | null>(null);
  const [activeGestureName, setActiveGestureName] = useState<string | null>(null);
  
  // Last Action variables to dispatch mock workspace movements
  const [lastActionId, setLastActionId] = useState<string | null>(null);
  const [lastActionTriggeredAt, setLastActionTriggeredAt] = useState<number>(0);

  // Overlay HUD states
  const [systemLocked, setSystemLocked] = useState(false);
  const [radialHudOpen, setRadialHudOpen] = useState(false);
  const [aiConsoleOpen, setAiConsoleOpen] = useState(false);

  // Create mapping modal toggle
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Virtual Mock Workspace states (Interactive Viewport mockup)
  const [activeBrowserTab, setActiveBrowserTab] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(70);
  const [trackIndex, setTrackIndex] = useState(0);

  // Helper trigger action pipeline
  const simulateGestureTrigger = (gestureId: string) => {
    if (!sensorConnected) return;

    // Load active mapping for current mode
    const modeMappings = mappings[currentMode];
    const mapping = modeMappings.find((m) => m.gestureId === gestureId);

    if (!mapping || !mapping.isActive) {
      console.log(`Gesture ${gestureId} is not mapped or active in current mode ${currentMode}`);
      return;
    }

    // Find models
    const gestureOpt = GESTURES.find((g) => g.id === gestureId);
    const actionOpt = ACTION_OPTIONS.find((a) => a.id === mapping.actionId);

    if (!gestureOpt || !actionOpt) return;

    // Flash trigger effects
    setActiveTriggeredId(gestureId);
    const confidence = Math.floor(Math.random() * (99 - 85 + 1)) + 85;
    setActiveConfidence(confidence);
    setActiveGestureName(gestureOpt.name);

    // Save action identifiers to trigger animations inside the Workspace UI mockup
    setLastActionId(actionOpt.id);
    setLastActionTriggeredAt(Date.now());

    // Lock screen trigger overrides
    if (actionOpt.id === 'system_sleep') {
      setSystemLocked(true);
    }

    // Append to logs
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const latency = Math.floor(Math.random() * 35) + 12;

    const newLog: GestureLog = {
      id: Math.random().toString(),
      timestamp: timeStr,
      gestureId,
      gestureName: gestureOpt.name,
      actionName: actionOpt.name,
      confidence,
      mode: currentMode,
      latencyMs: latency,
    };

    setLogs((prev) => [newLog, ...prev.slice(0, 9)]);

    // Increment timesTriggered inside state mapping
    setMappings((prev) => {
      const updatedList = prev[currentMode].map((m) => {
        if (m.gestureId === gestureId) {
          return { ...m, timesTriggered: m.timesTriggered + 1 };
        }
        return m;
      });
      return { ...prev, [currentMode]: updatedList };
    });

    // Clear active highlight after 850ms
    setTimeout(() => {
      setActiveTriggeredId(null);
    }, 850);
  };

  // Keyboard shortcut binding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 's') {
        simulateGestureTrigger('swipe_left');
      } else if (key === 'd') {
        simulateGestureTrigger('swipe_right');
      } else if (key === 'p') {
        simulateGestureTrigger('pinch');
      } else if (key === 't') {
        simulateGestureTrigger('double_tap');
      } else if (key === 'h') {
        simulateGestureTrigger('palm_hold');
      } else if (key === 'c') {
        simulateGestureTrigger('circular_motion');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMode, mappings, sensorConnected]);

  // Updating single mapping parameters
  const updateMapping = (mappingId: string, updates: Partial<GestureMapping>) => {
    setMappings((prev) => {
      const updatedList = prev[currentMode].map((m) => {
        if (m.id === mappingId) {
          return { ...m, ...updates };
        }
        return m;
      });
      return { ...prev, [currentMode]: updatedList };
    });
  };

  // Creating custom dynamic mapping row
  const forgeCustomMapping = (gestureId: string, actionId: string, sensitivity: number) => {
    const newMappingId = `custom_${Date.now()}`;
    const newMapping: GestureMapping = {
      id: newMappingId,
      gestureId,
      actionId,
      isActive: true,
      sensitivity,
      timesTriggered: 0,
    };

    setMappings((prev) => {
      // Avoid duplicates
      const filtered = prev[currentMode].filter((m) => m.gestureId !== gestureId);
      return {
        ...prev,
        [currentMode]: [...filtered, newMapping],
      };
    });

    // append to telemetry logs
    const gestureObj = GESTURES.find((g) => g.id === gestureId);
    const actionObj = ACTION_OPTIONS.find((a) => a.id === actionId);
    const timeStr = new Date().toTimeString().split(' ')[0];

    if (gestureObj && actionObj) {
      setLogs((prev) => [
        {
          id: Math.random().toString(),
          timestamp: timeStr,
          gestureId: 'system',
          gestureName: 'Network Connective',
          actionName: `Forged custom synapse: ${gestureObj.name} ➔ ${actionObj.name}`,
          confidence: 100,
          mode: currentMode,
          latencyMs: 1,
        },
        ...prev,
      ]);
    }
  };

  // Deleting custom dynamic mapping row
  const deleteMapping = (mappingId: string) => {
    setMappings((prev) => {
      const filteredList = prev[currentMode].filter((m) => m.id !== mappingId);
      return { ...prev, [currentMode]: filteredList };
    });
  };

  // Reset to default presets
  const resetToFactoryDefaults = () => {
    setMappings(JSON.parse(JSON.stringify(DEFAULT_MAPPINGS)));
    setLogs((prev) => [
      {
        id: Math.random().toString(),
        timestamp: new Date().toTimeString().split(' ')[0],
        gestureId: 'system',
        gestureName: 'Defaults Restoration',
        actionName: 'Restored factory gestural mapping synapses',
        confidence: 100,
        mode: currentMode,
        latencyMs: 3,
      },
      ...prev,
    ]);
  };

  // Auto-dismiss loading intro on scroll/swipe
  useEffect(() => {
    if (!loading) return;

    const handleScrollOrSwipe = (e: WheelEvent | TouchEvent) => {
      let triggered = false;
      if ('deltaY' in e) {
        if (Math.abs(e.deltaY) > 5) {
          triggered = true;
        }
      } else if (e.touches && e.touches.length > 0) {
        triggered = true;
      }
      
      if (triggered) {
        setLoading(false);
      }
    };

    window.addEventListener('wheel', handleScrollOrSwipe, { passive: true });
    window.addEventListener('touchmove', handleScrollOrSwipe, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleScrollOrSwipe);
      window.removeEventListener('touchmove', handleScrollOrSwipe);
    };
  }, [loading]);

  const pathVariants: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: i * 0.12, duration: 1.8, ease: 'easeInOut' as const },
        opacity: { delay: i * 0.12 + 0.05, duration: 0.2 },
      },
    }),
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#040810]/40 text-slate-300 font-sans pb-28 antialiased">
      {/* WebGL Animated Cyber Plasma Grid Background */}
      <ShaderBackground />

      {/* Cinematic Splash/Loading Deck */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#03060c]/15 backdrop-blur-[2px] overflow-hidden select-none cursor-ns-resize"
          >
            {/* Cybergrid ambient overlays */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(32,178,170,0.06)_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none" />
            <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] bg-emerald-active/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[20%] right-[10%] w-[450px] h-[450px] bg-[#20B2AA]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center text-center space-y-12">
              
              {/* BRAND VECTOR DECK GRAPHIC - DRAWN ANIMATION */}
              <div className="relative">
                <svg viewBox="0 0 350 100" className="w-72 sm:w-[480px] text-teal-300 drop-shadow-[0_0_24px_rgba(45,212,191,0.3)]">
                  <g stroke="currentColor" fill="none" fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
                    {/* K - Vertical Stem */}
                    <motion.path 
                      variants={pathVariants} 
                      custom={0} 
                      initial="hidden" 
                      animate="visible" 
                      d="M 20,25 L 20,75"
                    />
                    {/* K - Top Slant */}
                    <motion.path 
                      variants={pathVariants} 
                      custom={1} 
                      initial="hidden" 
                      animate="visible" 
                      d="M 50,25 L 20,50"
                    />
                    {/* K - Bottom Slant */}
                    <motion.path 
                      variants={pathVariants} 
                      custom={2} 
                      initial="hidden" 
                      animate="visible" 
                      d="M 22,48 L 50,75"
                    />
                    
                    {/* I - Vertical Stem */}
                    <motion.path 
                      variants={pathVariants} 
                      custom={3} 
                      initial="hidden" 
                      animate="visible" 
                      d="M 80,25 L 80,75"
                    />
                    
                    {/* N - Left Spine */}
                    <motion.path 
                      variants={pathVariants} 
                      custom={4} 
                      initial="hidden" 
                      animate="visible" 
                      d="M 105,75 L 105,25"
                    />
                    {/* N - Diagonal Spine */}
                    <motion.path 
                      variants={pathVariants} 
                      custom={5} 
                      initial="hidden" 
                      animate="visible" 
                      d="M 105,25 L 140,75"
                    />
                    {/* N - Right Spine */}
                    <motion.path 
                      variants={pathVariants} 
                      custom={6} 
                      initial="hidden" 
                      animate="visible" 
                      d="M 140,75 L 140,25"
                    />
                    
                    {/* E - Spine */}
                    <motion.path 
                      variants={pathVariants} 
                      custom={7} 
                      initial="hidden" 
                      animate="visible" 
                      d="M 160,75 L 160,25"
                    />
                    {/* E - Top prong */}
                    <motion.path 
                      variants={pathVariants} 
                      custom={8} 
                      initial="hidden" 
                      animate="visible" 
                      d="M 160,25 L 190,25"
                    />
                    {/* E - Mid prong */}
                    <motion.path 
                      variants={pathVariants} 
                      custom={9} 
                      initial="hidden" 
                      animate="visible" 
                      d="M 160,50 L 185,50"
                    />
                    {/* E - Bottom prong */}
                    <motion.path 
                      variants={pathVariants} 
                      custom={10} 
                      initial="hidden" 
                      animate="visible" 
                      d="M 160,75 L 190,75"
                    />
                    
                    {/* T - Top Crossbar */}
                    <motion.path 
                      variants={pathVariants} 
                      custom={11} 
                      initial="hidden" 
                      animate="visible" 
                      d="M 210,25 L 240,25"
                    />
                    {/* T - Stem */}
                    <motion.path 
                      variants={pathVariants} 
                      custom={12} 
                      initial="hidden" 
                      animate="visible" 
                      d="M 225,25 L 225,75"
                    />
                    
                    {/* I - Stem */}
                    <motion.path 
                      variants={pathVariants} 
                      custom={13} 
                      initial="hidden" 
                      animate="visible" 
                      d="M 265,25 L 265,75"
                    />
                    
                    {/* X - Falling Diagonal */}
                    <motion.path 
                      variants={pathVariants} 
                      custom={14} 
                      initial="hidden" 
                      animate="visible" 
                      d="M 295,25 L 330,75"
                    />
                    {/* X - Rising Diagonal */}
                    <motion.path 
                      variants={pathVariants} 
                      custom={15} 
                      initial="hidden" 
                      animate="visible" 
                      d="M 330,25 L 295,75"
                    />
                  </g>
                </svg>
              </div>

              {/* Elegant italicized deep functional description */}
              <motion.p 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 1.2 }}
                className="text-xs sm:text-sm text-teal-200/70 font-light tracking-wider italic max-w-md px-6 text-center leading-relaxed"
              >
                An interactive spatial canvas for fluid gestural orchestration and cybernetic control.
              </motion.p>

              {/* Minimal Interactive Navigation Line Descriptor */}
              <div className="flex flex-col items-center space-y-6 pt-8">
                <span className="text-[10px] font-mono tracking-[0.3em] text-[#20b2aa] uppercase animate-pulse">
                  SCROLL OR DRAG DOWN TO DISCOVER
                </span>
                
                {/* Physical Interactive Scroll Track & Indicator */}
                <motion.div 
                  onClick={() => setLoading(false)}
                  className="relative w-[3px] h-28 bg-white/10 rounded-full overflow-hidden cursor-pointer group"
                  whileHover={{ scale: 1.15 }}
                >
                  <motion.div 
                    animate={{ 
                      y: [0, 72, 0],
                      height: ["28px", "56px", "28px"]
                    }}
                    transition={{ 
                      duration: 2.5, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    className="absolute top-0 left-0 w-full bg-gradient-to-b from-[#20B2AA] to-teal-400 shadow-[0_0_12px_#2dd4bf] rounded-full"
                  />
                </motion.div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!loading && (
          <motion.div
            key="main-dashboard-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: "easeOut" }}
            className="w-full h-full"
          >
            {/* Background Ambient Glows */}
            <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] bg-[#10B981]/8 rounded-full blur-[140px] pointer-events-none select-none z-0" />
            <div className="absolute bottom-[-5%] right-[-5%] w-[700px] h-[700px] bg-[#20B2AA]/5 rounded-full blur-[160px] pointer-events-none select-none z-0" />
            <div className="absolute top-[35%] right-[25%] w-[450px] h-[450px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none select-none z-0" />

            {/* 1. TOP HEADER & THE FLOATING MODE ISLAND */}
            <header className="relative z-20 max-w-7xl mx-auto px-4 pt-6 pb-4 flex flex-col items-center gap-6">
        
        {/* Brand block & Header diagnostics */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sea-green to-aquamarine-accent flex items-center justify-center font-display font-black text-[#0a111a] shadow-[0_0_20px_rgba(32,178,170,0.45)] text-base italic select-none">
              κ
            </div>
            <div>
              <h1 className="text-base font-display font-bold text-white tracking-widest uppercase">
                KINETIX
              </h1>
              <p className="text-[9px] font-mono tracking-widest text-[#20b2aa]">
                GESTURAL SPATIAL FLUID CYBER-DECK
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <button
              id="power-disconnect-btn"
              onClick={() => setSensorConnected(!sensorConnected)}
              className={`p-1 px-[11px] py-1.5 rounded-xl border transition-all cursor-pointer text-xs font-semibold tracking-wide ${
                sensorConnected
                  ? 'bg-emerald-active/10 border-emerald-active/30 text-emerald-active'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              SIMULATION: {sensorConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </button>
          </div>
        </div>

        {/* Floating Mode Island */}
        <ModeIsland
          currentMode={currentMode}
          onModeChange={setCurrentMode}
          isConnected={sensorConnected}
        />
      </header>

      {/* 2. MAIN GRID HUD WORKSPACE CONTAINER */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 mt-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SECTION (Columns 1 to 7) — Connections Workspace & Mock Tab Viewports */}
          <section className="lg:col-span-7 space-y-6">
            
            {/* The Node Connection mapping board */}
            <div id="synapse-deck" className="bg-white/[0.03] border border-white/10 p-6 rounded-3xl backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.37)]">

              {/* The dynamic mapping grid list */}
              <MappingCanvas
                currentMode={currentMode}
                mappings={mappings[currentMode]}
                gestures={GESTURES}
                actions={ACTION_OPTIONS}
                onUpdateMapping={updateMapping}
                onDeleteMapping={deleteMapping}
                activeTriggeredId={activeTriggeredId}
                onTriggerGestureSimulate={simulateGestureTrigger}
                onForgeClick={() => setIsCreateModalOpen(true)}
                onResetClick={resetToFactoryDefaults}
              />
            </div>
          </section>

          {/* RIGHT SECTION (Columns 8 to 12) — Viewport & Energy Orb HUD */}
          <section className="lg:col-span-5">
            <StatusMonitor
              currentMode={currentMode}
              logs={logs}
              onTriggerGestureSimulate={simulateGestureTrigger}
              activeTriggeredId={activeTriggeredId}
              activeConfidence={activeConfidence}
              activeGestureName={activeGestureName}
            />
          </section>

        </div>

        {/* THE VISUAL FEEDBACK INTERACTIVE WORKSPACE VIEWPORT — Now FULL Rectangular Width */}
        <div id="mock-workspace-viewport" className="mt-8 bg-white/[0.03] border border-white/10 rounded-3xl backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.37)] space-y-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
            <div>
              <h3 className="font-display font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                <Monitor size={15} className="text-aquamarine-accent" /> Active Simulation Console Mockup
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Test outcomes here. Triggering gesture binds dynamically manipulates coordinates or widgets below!
              </p>
            </div>

            {/* Simulated active file tabs */}
            <div className="flex items-center gap-1.5 bg-white/[0.04] p-1.5 rounded-xl border border-white/5 text-[10px] font-mono backdrop-blur-md">
              <span className="text-[9px] text-[#20b2aa]/60 uppercase tracking-widest pl-2 pr-1">MOCK OS_TABS</span>
              {['Browser Layout', 'Media Center', 'Gemini Brain'].map((tabLabel, tabIdx) => (
                <button
                  id={`workspace-mini-tab-${tabIdx}`}
                  key={tabLabel}
                  onClick={() => setActiveBrowserTab(tabIdx)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-semibold ${
                    activeBrowserTab === tabIdx
                      ? 'bg-[#20b2aa]/20 text-white font-bold'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tabLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Simulated Tab View Area */}
          <div className="bg-slate-950/45 rounded-2xl p-5 border border-white/5 min-h-[190px] flex flex-col justify-between relative overflow-hidden">
            
            {/* Scroll track indicators */}
            <div className="absolute right-2 top-2 bottom-2 w-1.5 bg-gray-900 rounded-full overflow-hidden">
              <motion.div
                className="bg-sea-green/60 w-full rounded-full"
                animate={{ height: '30%', y: `${(scrollOffset / 500) * 120}px` }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              />
            </div>

            {/* Sub Tab Contents 0: System Diagnostics */}
            {activeBrowserTab === 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono font-medium text-aquamarine-accent">GRID_COORDINATES_ANALYTICS.EXE</span>
                  <span className="text-[9px] font-mono text-gray-500">SCROLL: {scrollOffset}px</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-navy-card/40 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[9px] font-mono text-gray-500 block uppercase">Synapse Load</span>
                    <div className="font-display font-medium text-white text-lg flex items-baseline gap-1">
                      24 <span className="text-[10px] font-mono text-sea-green">GHz</span>
                    </div>
                  </div>
                  <div className="p-3 bg-navy-card/40 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[9px] font-mono text-gray-500 block uppercase">Integrity</span>
                    <div className="font-display font-medium text-emerald-active text-lg flex items-baseline gap-1">
                      100<span className="text-[10px] font-mono text-gray-500">%</span>
                    </div>
                  </div>
                  <div className="p-3 bg-navy-card/40 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[9px] font-mono text-gray-500 block uppercase">Fires/Min</span>
                    <div className="font-display font-medium text-white text-lg flex items-baseline gap-1">
                      142 <span className="text-[10px] font-mono text-aquamarine-accent">p</span>
                    </div>
                  </div>
                </div>

                {/* Scrolling area details */}
                <div className="h-10 overflow-hidden relative">
                  <motion.div
                    animate={{ y: -scrollOffset / 5 }}
                    transition={{ type: 'spring', stiffness: 150, damping: 20 }}
                    className="space-y-1 text-[10px] font-mono text-gray-400"
                  >
                    <p className="text-gray-500">06:35:01 [System Core] Neural matrix loaded correctly without offset.</p>
                    <p>06:35:12 [Lidar Parser] Camera thread bound coordinates: X_POS: 122.4, Y_POS: 310.2</p>
                    <p className="text-white">06:35:14 [Synapse Dispatcher] Gesture confirmed! Firing bound Tab Next event callback.</p>
                    <p className="text-emerald-active">06:35:15 [Feedback UI] Executed tab navigation successfully.</p>
                    <p>06:35:30 [Power Diagnostics] Dynamic calibration loop complete. Waiting for sensor...</p>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Sub Tab Contents 1: Music Deck */}
            {activeBrowserTab === 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                
                {/* Compact vinyl player layout */}
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 bg-gradient-to-tr from-gray-800 to-black rounded-full flex items-center justify-center border border-white/10 shrink-0 shadow-lg">
                    <motion.div
                      animate={isPlaying ? { rotate: 360 } : {}}
                      transition={{ repeat: Infinity, ease: 'linear', duration: 4 }}
                      className="h-14 w-14 rounded-full bg-navy-card border border-sea-green/20 flex items-center justify-center relative"
                    >
                      <div className="h-4 w-4 rounded-full bg-sea-green" />
                    </motion.div>
                  </div>

                  <div className="min-w-0">
                    <span className="text-[9px] font-mono uppercase bg-emerald-active/10 text-emerald-active px-2 py-0.5 rounded border border-emerald-active/10 mb-1 inline-block">
                      {isPlaying ? '● ACTIVE STREAM' : '● SOUND PAUSED'}
                    </span>
                    <h4 className="font-display font-medium text-white text-sm tracking-tight truncate">
                      {TUNES[trackIndex].title}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-mono truncate">
                      {TUNES[trackIndex].artist}
                    </p>
                  </div>
                </div>

                {/* Equalizer sound visualizer blocks & player widgets */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-end gap-1.5 h-10 px-3 py-1 bg-black/40 rounded-xl border border-white/5">
                    {[4, 8, 2, 9, 6, 3, 7, 5].map((h, i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 rounded-full bg-sea-green"
                        animate={
                          isPlaying
                            ? { height: [`${h * 10}%`, `${(12 - h) * 10}%`, `${h * 10}%`] }
                            : { height: '15%' }
                        }
                        transition={{
                          duration: 0.6 + i * 0.08,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 bg-navy-card/50 px-3 py-1 rounded-lg border border-white/5">
                    <span>VOLUME:</span>
                    <span className="text-white font-bold">{volume}%</span>
                  </div>
                </div>

              </div>
            )}

            {/* Sub Tab Contents 2: Gemini Brain Chat logs */}
            {activeBrowserTab === 2 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-display font-bold text-white">
                  <Sparkles className="w-3.5 h-3.5 text-aquamarine-accent" />
                  <span>Gemini Cogency Intelligent Prompter</span>
                </div>

                <div className="p-3 bg-[#050a0f]/60 rounded-xl border border-[#20b2aa]/15 text-[11px] leading-relaxed">
                  <code className="text-[#20b2aa] font-mono block mb-1">PROMPT_TRAINED_INTELLIGENCE:</code>
                  "This client deck parses 3D vector coordinates into discrete event chains. Currently running with zero-touch calibration on {currentMode === 'Browser' ? 'Chrome layout tab viewport bindings' : currentMode === 'Media' ? 'Spotify API bridge loops' : 'Native lockscreen bindings'}."
                </div>

                <p className="text-[9px] text-gray-500 font-mono font-normal">
                  Server-side Gemini cognitive feedback model stands ready. Trigger "Invoke Gemini" gestures.
                </p>
              </div>
            )}

            {/* Bottom indicators */}
            <div className="flex items-center justify-between text-[9px] font-mono text-gray-500 border-t border-white/5 pt-2 mt-4">
              <span className="flex items-center gap-1">
                <Activity className="w-3 text-sea-green" /> Mapped Triggers: {mappings[currentMode].length} Bound Nodes
              </span>
              <span>CALIBRATION CODE: ACC-104</span>
            </div>

          </div>
        </div>

      </main>

      {/* 3. FOOTER ACCORDION / DOCUMENTATION / HOW TO TEST */}
      <footer className="relative z-10 max-w-7xl mx-auto px-4 mt-12">
        <div className="p-6 rounded-3xl border border-navy-border/60 bg-[#0e1a24]/10 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-sea-green" /> Space Biometric Orchestration
            </h4>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Use the fully interactive and detailed <span className="text-[#7FFFD4] font-semibold">Tactile Synergy Sandbox</span> and <span className="text-[#7FFFD4] font-semibold">Resonance Simulation Panels</span> on the right HUD dashboard to simulate and test live gesture pipelines seamlessly from any device. Keyboard mappings <kbd className="text-[#7FFFD4] font-bold mx-0.5">S</kbd>, <kbd className="text-[#7FFFD4] font-bold mx-0.5">D</kbd>, <kbd className="text-[#7FFFD4] font-bold mx-0.5">P</kbd>, <kbd className="text-[#7FFFD4] font-bold mx-0.5">T</kbd>, <kbd className="text-[#7FFFD4] font-bold mx-0.5">H</kbd>, <kbd className="text-[#7FFFD4] font-bold mx-0.5">C</kbd> are also listening actively.
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-start md:items-end gap-1 font-mono text-[10px] text-gray-500 text-left md:text-right">
            <span>© 2026 Kinetix Spatial Technologies Inc.</span>
            <span>Bioluminescent Glass Control Framework</span>
            <div className="flex items-center gap-1 text-emerald-active font-semibold mt-1">
              <span className="h-1.5 w-1.5 bg-emerald-active rounded-full animate-pulse"></span>
              <span>Proxy Server Connected</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 4. MODALS & DETACHED INTELLIGENT HUD COGNITION SYSTEMS */}
      <CustomMappingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentMode={currentMode}
        gestures={GESTURES}
        actions={ACTION_OPTIONS}
        onForgeMapping={forgeCustomMapping}
      />

      <ActionFeedbackOverlay
        currentMode={currentMode}
        lastActionId={lastActionId}
        lastActionTriggeredAt={lastActionTriggeredAt}
        systemLocked={systemLocked}
        onUnlockSystem={() => {
          setSystemLocked(false);
          setLastActionId(null);
        }}
        radialHudOpen={radialHudOpen}
        onToggleRadialHud={setRadialHudOpen}
        activeBrowserTab={activeBrowserTab}
        onSetBrowserTab={setActiveBrowserTab}
        scrollOffset={scrollOffset}
        onSetScrollOffset={setScrollOffset}
        isPlaying={isPlaying}
        onSetIsPlaying={setIsPlaying}
        volume={volume}
        onSetVolume={setVolume}
        trackIndex={trackIndex}
        onSetTrackIndex={setTrackIndex}
        aiConsoleOpen={aiConsoleOpen}
        onToggleAiConsole={setAiConsoleOpen}
      />

      {/* Elegant Dark Bottom Sticky Marquee Ticker */}
      <div id="elegant-dark-bottom-ticker" className="fixed bottom-0 left-0 right-0 h-16 border-t border-white/5 bg-[#050A0F]/95 backdrop-blur-md flex items-center px-6 md:px-8 space-x-8 z-40 select-none">
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_8px_#10B981]"></div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#20B2AA] uppercase">Live Feed</span>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <div className="flex space-x-12 whitespace-nowrap">
            {logs.length > 0 ? (
              <span className="text-xs font-medium text-slate-300">
                ⚡ <span className="italic font-bold text-white">Action Confirmed</span> &mdash; Last gesture <span className="text-[#7FFFD4] font-bold">*{logs[0].gestureName}*</span> mapped to <span className="text-[#20B2AA] font-semibold">"{logs[0].actionName}"</span> with {logs[0].confidence || 98.4}% Accuracy
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-400">
                ⚡ <span className="italic font-bold text-white font-medium">Scanner Steady</span> &mdash; Waiting for coordinate synapse detection.
              </span>
            )}
            <span className="text-xs font-medium text-[#20B2AA]">
              ⚡ <span className="italic font-bold">Swipe Left Detected</span> &mdash; Auto-mapping to browser workspace macros
            </span>
            <span className="text-xs font-medium text-slate-500 italic hidden md:inline">
              Scanning environment for spatial palm rotation...
            </span>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center space-x-4 text-[10px] font-mono text-slate-600 shrink-0">
          <span>LATENCY: {logs[0]?.latencyMs ?? 14}ms</span>
          <span>FPS: 120</span>
          <span>ID: KX-909</span>
        </div>
      </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
