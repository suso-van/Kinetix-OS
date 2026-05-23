import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActionOption, ControlMode } from '../types';
import { TUNES } from '../data';
import LucideIcon from './LucideIcon';
import { Sparkles, X, Terminal, Radio, HelpCircle } from 'lucide-react';

interface ActionFeedbackOverlayProps {
  currentMode: ControlMode;
  lastActionId: string | null;
  lastActionTriggeredAt: number; // timestamp to check expiry
  systemLocked: boolean;
  onUnlockSystem: () => void;
  radialHudOpen: boolean;
  onToggleRadialHud: (open: boolean) => void;
  // Browser state
  activeBrowserTab: number;
  onSetBrowserTab: (index: number) => void;
  scrollOffset: number; // 0 to 500
  onSetScrollOffset: (offset: number) => void;
  // Music state
  isPlaying: boolean;
  onSetIsPlaying: (p: boolean) => void;
  volume: number; // 0 to 100
  onSetVolume: (v: number) => void;
  trackIndex: number;
  onSetTrackIndex: (idx: number) => void;
  // AI assistant console
  aiConsoleOpen: boolean;
  onToggleAiConsole: (open: boolean) => void;
}

export default function ActionFeedbackOverlay({
  currentMode,
  lastActionId,
  lastActionTriggeredAt,
  systemLocked,
  onUnlockSystem,
  radialHudOpen,
  onToggleRadialHud,
  activeBrowserTab,
  onSetBrowserTab,
  scrollOffset,
  onSetScrollOffset,
  isPlaying,
  onSetIsPlaying,
  volume,
  onSetVolume,
  trackIndex,
  onSetTrackIndex,
  aiConsoleOpen,
  onToggleAiConsole,
}: ActionFeedbackOverlayProps) {
  // Show a mini notification overlay when actions trigger
  const [notification, setNotification] = useState<{ id: string; text: string; icon: string } | null>(null);
  const [volumeNotification, setVolumeNotification] = useState<boolean>(false);
  const [reloadTriggered, setReloadTriggered] = useState<boolean>(false);

  // Catch action logs and spawn notifications
  useEffect(() => {
    if (!lastActionId) return;

    if (lastActionId === 'tab_next') {
      onSetBrowserTab((activeBrowserTab + 1) % 3);
      showNotice('Switched to Next Tab Layout', 'ChevronsRight');
    } else if (lastActionId === 'tab_prev') {
      onSetBrowserTab(activeBrowserTab === 0 ? 2 : activeBrowserTab - 1);
      showNotice('Switched to Previous Tab Layout', 'ChevronsLeft');
    } else if (lastActionId === 'scroll_down') {
      onSetScrollOffset(Math.min(500, scrollOffset + 120));
      showNotice('View Scrolled Down', 'ArrowDown');
    } else if (lastActionId === 'scroll_up') {
      onSetScrollOffset(Math.max(0, scrollOffset - 120));
      showNotice('View Scrolled Up', 'ArrowUp');
    } else if (lastActionId === 'refresh_page') {
      setReloadTriggered(true);
      const t = setTimeout(() => setReloadTriggered(false), 1200);
      showNotice('Reloaded Core Diagnostics Database', 'RefreshCw');
      return () => clearTimeout(t);
    } else if (lastActionId === 'play_pause') {
      onSetIsPlaying(!isPlaying);
      showNotice(isPlaying ? 'Audio Playback Paused' : 'Audio Playback Standard Active', isPlaying ? 'Volume1' : 'PlayPause');
    } else if (lastActionId === 'skip_next') {
      onSetTrackIndex((trackIndex + 1) % TUNES.length);
      showNotice(`Next Track: "${TUNES[(trackIndex + 1) % TUNES.length].title}"`, 'SkipForward');
    } else if (lastActionId === 'volume_up') {
      onSetVolume(Math.min(100, volume + 10));
      setVolumeNotification(true);
      const t = setTimeout(() => setVolumeNotification(false), 1500);
      return () => clearTimeout(t);
    } else if (lastActionId === 'volume_down') {
      onSetVolume(Math.max(0, volume - 10));
      setVolumeNotification(true);
      const t = setTimeout(() => setVolumeNotification(false), 1500);
      return () => clearTimeout(t);
    } else if (lastActionId === 'mute_toggle') {
      onSetVolume(volume > 0 ? 0 : 50);
      showNotice(volume > 0 ? 'Muted All System Audio Outputs' : 'Restored Volume 50%', 'VolumeX');
    } else if (lastActionId === 'open_launcher') {
      onToggleRadialHud(!radialHudOpen);
      showNotice(radialHudOpen ? 'Collapsed Spatial Performance HUD' : 'Deployed Spatial Performance HUD Grid', 'Grid');
    } else if (lastActionId === 'system_sleep') {
      // Locking triggers
      showNotice('Workspace locked for privacy security', 'Lock');
    } else if (lastActionId === 'ai_command') {
      onToggleAiConsole(true);
      showNotice('Summoned Gemini Spatial Intelligence Core', 'Sparkles');
    } else if (lastActionId === 'toggle_hud') {
      onToggleRadialHud(!radialHudOpen);
      showNotice('Toggled Development HUD Dashboard', 'Terminal');
    }
  }, [lastActionId, lastActionTriggeredAt]);

  const showNotice = (text: string, icon: string) => {
    setNotification({ id: Math.random().toString(), text, icon });
  };

  // Clear notice after 2.5s
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 2500);
    return () => clearTimeout(t);
  }, [notification]);

  return (
    <div id="action-feedbacks-vault" className="pointer-events-none fixed inset-0 z-50">
      
      {/* 1. Global Floating action banner notice */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
        <AnimatePresence>
          {notification && (
            <motion.div
              id="top-action-toast"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="px-5 py-2.5 rounded-full border border-sea-green/45 bg-slate-950/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(32,178,170,0.3)] flex items-center gap-3 pointer-events-auto"
            >
              <div className="p-1 rounded-full bg-sea-green/10 text-[#7fffd4]">
                <LucideIcon name={notification.icon} size={14} />
              </div>
              <span className="text-xs font-mono font-medium text-white italic">
                {notification.text}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Visual Volume Slider overlay HUD popup */}
      <div className="fixed bottom-24 right-6 z-50">
        <AnimatePresence>
          {volumeNotification && (
            <motion.div
              id="volume-toast-hud"
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="bg-slate-950/95 backdrop-blur-xl border border-[#20b2aa]/35 p-4 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-48 pointer-events-auto font-mono text-center flex flex-col items-center"
            >
              <div className="flex items-center gap-2 mb-2 text-xs text-aquamarine-accent uppercase font-bold tracking-wider">
                <LucideIcon name={volume === 0 ? 'VolumeX' : volume > 50 ? 'Volume2' : 'Volume1'} size={14} />
                <span>VOLUME TUNING</span>
              </div>
              <div className="text-xl text-white font-black font-display tracking-tight mb-2">
                {volume}% AMPlitude
              </div>
              <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="bg-sea-green h-full"
                  animate={{ width: `${volume}%` }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Global reloading overlay layout */}
      <AnimatePresence>
        {reloadTriggered && (
          <motion.div
            id="reload-lockout-dimmer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#050a0f]/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <div className="text-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 0.8 }}
                className="inline-block p-4 rounded-full border-2 border-dashed border-sea-green text-sea-green shadow-[0_0_20px_rgba(32,178,170,0.3)]"
              >
                <LucideIcon name="RefreshCw" size={28} />
              </motion.div>
              <p className="font-display font-bold text-lg text-white uppercase tracking-wider">Re-Aligning Lidar Pixels</p>
              <p className="text-xs text-gray-400 font-mono italic">Calibrating matrix spatial coordinates (0 latency synchronization)...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Deep Lock Screen Session view */}
      <AnimatePresence>
        {systemLocked && (
          <motion.div
            id="system-lockout-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#050a0f]/95 backdrop-blur-2xl z-50 flex items-center justify-center p-6 pointer-events-auto"
          >
            <div className="max-w-md w-full bg-white/[0.02] backdrop-blur-xl border border-red-500/30 p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-center space-y-6 relative overflow-hidden group">
              {/* Grid effects */}
              <div className="absolute inset-0 bg-[radial-gradient(rgba(239,68,68,0.05)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="p-4 rounded-full border border-red-500/20 bg-red-500/5 text-red-400 animate-pulse mb-4">
                  <LucideIcon name="Lock" size={32} />
                </div>
                
                <h3 className="font-display font-black text-2xl uppercase text-white tracking-widest italic">
                  SYSTEM LOCK ACTIVE
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-1 mt-2">
                  Gestural security protocol activated. Workspace is blurred and secured.
                </p>

                {/* Simulated Hand Skeletal Recognition Area */}
                <div className="mt-8 relative h-40 w-40 flex items-center justify-center border border-red-500/10 rounded-xl bg-black/60 shadow-inner group">
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-red-500/10 to-transparent animate-pulse" />
                  
                  {/* Glowing fingerprint vector representation */}
                  <motion.div
                    animate={{ scale: [0.95, 1.05, 0.95] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-red-400/80 group-hover:text-red-400 transition-colors"
                  >
                    <LucideIcon name="Fingerprint" size={54} />
                  </motion.div>

                  {/* Fingerprint laser sweep */}
                  <motion.div
                    className="absolute inset-x-4 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444]"
                    animate={{ top: ['10%', '90%', '10%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>

                <div className="mt-8 space-y-3 w-full">
                  <button
                    id="sim-unlock-btn"
                    onClick={onUnlockSystem}
                    className="w-full py-3 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/35 text-red-200 border border-red-500/20 transition-all font-mono text-xs uppercase tracking-widest font-bold active:scale-[0.98] cursor-pointer"
                  >
                    ⚡ Simulate "Palm Hold" to Unlock
                  </button>
                  <p className="text-[10px] text-gray-500 font-mono">
                    Privacy code compliance secured (256-bit gestural shield)
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. DIAGNOSTICS PERFORMANCE HUD / RADIAL RADAR METERS */}
      <AnimatePresence>
        {radialHudOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#050a0f]/80 backdrop-blur-md z-50 cursor-pointer pointer-events-auto"
              onClick={() => onToggleRadialHud(false)}
            />
            {/* Centered Modal Container */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                id="radial-hud-drawer"
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="bg-slate-950/95 border border-white/10 rounded-3xl p-6 shadow-[0_16px_40px_rgba(0,0,0,0.85)] max-w-md w-full relative overflow-hidden pointer-events-auto backdrop-blur-2xl"
              >
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#20b2aa]/15">
                  <div className="flex items-center gap-2 font-display font-bold text-sm text-white">
                    <LucideIcon name="Activity" className="text-sea-green hover:animate-spin" />
                    <span className="uppercase tracking-wider text-xs">SYNAPSE PERFORMANCE HUD</span>
                  </div>
                  <button
                    id="close-hud-btn"
                    onClick={() => onToggleRadialHud(false)}
                    className="p-1 px-1.5 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Simulated diagnostic elements */}
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-gray-400">
                      <span>SYNAPTIC BANDWIDTH</span>
                      <span className="text-aquamarine-accent">1.2 TBPS</span>
                    </div>
                    <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                      <div className="w-[88%] h-full bg-aquamarine-accent" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-gray-400">
                      <span>CAMERA CLARITY</span>
                      <span className="text-sea-green">94.8% (EXCELLENT)</span>
                    </div>
                    <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                      <div className="w-[94%] h-full bg-sea-green" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-gray-400">
                      <span>CPU SYNAPSE THREAD</span>
                      <span className="text-emerald-active">0.24% CYCLE</span>
                    </div>
                    <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                      <div className="w-[12%] h-full bg-emerald-active" />
                    </div>
                  </div>

                  {/* Grid of micro monitors */}
                  <div className="grid grid-cols-2 gap-2 pt-2 text-[10px]">
                    <div className="bg-white/[0.02] p-2 rounded-xl border border-white/5">
                      <span className="text-gray-500 block">HAND SEGMENTS</span>
                      <span className="text-white font-bold">21 JOINTS STABLE</span>
                    </div>
                    <div className="bg-white/[0.02] p-2 rounded-xl border border-white/5">
                      <span className="text-gray-500 block">FOV RATIO</span>
                      <span className="text-white font-bold">4.3 HEIGHT_X</span>
                    </div>
                    <div className="bg-white/[0.02] p-2 rounded-xl border border-white/5">
                      <span className="text-gray-500 block">COGNITION LAT</span>
                      <span className="text-white font-bold">~12.4 MilliSeconds</span>
                    </div>
                    <div className="bg-white/[0.02] p-2 rounded-xl border border-white/5">
                      <span className="text-gray-500 block">HARDWARE LOCK</span>
                      <span className="text-white font-bold">ZERO FALSE-FIRING</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-sea-green/5 border border-sea-green/20 text-[#7fffd4] text-[10px] leading-relaxed">
                    <div className="font-bold flex items-center gap-1 mb-1 font-display">
                      <HelpCircle className="w-3" /> Quick Tip
                    </div>
                    Place your face about 1 meter from your workstation camera for perfect bioluminescent hand skeletal tracking!
                  </div>

                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* 6. INTELLIGENT COMPANION AI CHAT CONSOLE */}
      <AnimatePresence>
        {aiConsoleOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#050a0f]/80 backdrop-blur-md z-50 cursor-pointer pointer-events-auto"
              onClick={() => onToggleAiConsole(false)}
            />
            {/* Centered Modal Container */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                id="ai-console-chat"
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="bg-slate-950/95 border border-white/10 rounded-3xl p-6 shadow-[0_16px_40px_rgba(0,0,0,0.85)] max-w-md w-full relative overflow-hidden pointer-events-auto flex flex-col max-h-[480px] backdrop-blur-2xl"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#20b2aa]/15 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-sea-green/10 text-aquamarine-accent animate-pulse">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-display font-medium text-xs text-white">AI Gesture Trainer Companion</h3>
                      <p className="text-[9px] text-[#20b2aa] font-mono leading-none mt-0.5">Gemini Server-Side Cogency Engine</p>
                    </div>
                  </div>
                  <button
                    id="close-ai-console"
                    onClick={() => onToggleAiConsole(false)}
                    className="p-1 px-1.5 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Static Simulated AI Chat Dialog */}
                <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1 flex flex-col mb-3">
                  <div className="bg-navy-card/85 p-3 rounded-lg border border-[#20b2aa]/10 text-gray-300">
                    Hi, I am Kinetix's intelligence core proxy. I am listening for your spatial coordinates. 
                    <div className="mt-2 text-[#7fffd4] font-mono text-[10px]">
                      *Status: Lidar coordinates parsing stable. Active mode: {currentMode} Mode.*
                    </div>
                  </div>
                  
                  <div className="ml-4 bg-sea-green/10 p-2.5 rounded-lg border border-sea-green/25 text-white text-[11px] font-mono self-end text-right">
                    Can you recommend the settings for low light gesture sensing?
                  </div>

                  <div className="bg-navy-card/85 p-3 rounded-lg border border-[#20b2aa]/10 text-gray-300">
                    In low light settings, I recommend raising gesture **sensitivity slider bounds to 85% - 90%**, and utilizing a standard hand tracking distance of **0.8 meters** from the webcam.
                    <div className="mt-2 text-emerald-active font-mono text-[10px]">
                      *Recommendation: Tap Double Air Taps with deliberate velocity.*
                    </div>
                  </div>
                </div>

                {/* Chat query inputs */}
                <div className="flex gap-2">
                  <input
                    id="ai-console-chat-input"
                    type="text"
                    placeholder="Ask instructions or suggest presets..."
                    className="flex-1 bg-navy-dark border border-navy-border text-xs rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-sea-green transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value;
                        (e.target as HTMLInputElement).value = '';
                        showNotice(`Processed query: "${val || 'Sensing'}"`, 'Sparkles');
                      }
                    }}
                  />
                  <button
                    onClick={() => showNotice('Telemetry feedback signal transmitted successfully to intelligence core.', 'Radio')}
                    className="px-3 rounded-xl bg-sea-green hover:bg-emerald-active text-navy-dark font-mono text-xs font-bold font-display uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Transmit
                  </button>
                </div>
                
                <div className="mt-2 text-center text-[8px] font-mono text-gray-500">
                  Proxy AI responses are fully secure and host credentials are proxy protected.
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
