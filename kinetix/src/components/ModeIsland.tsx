import React from 'react';
import { motion } from 'motion/react';
import { ControlMode } from '../types';
import { Compass, PlayCircle, Cpu, Radio } from 'lucide-react';

interface ModeIslandProps {
  currentMode: ControlMode;
  onModeChange: (mode: ControlMode) => void;
  isConnected: boolean;
}

export default function ModeIsland({ currentMode, onModeChange, isConnected }: ModeIslandProps) {
  const modes: { id: ControlMode; label: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'Browser',
      label: 'Browser Controls',
      icon: <Compass className="w-4 h-4" />,
      color: 'from-sea-green to-aquamarine-accent',
    },
    {
      id: 'Media',
      label: 'Media Deck',
      icon: <PlayCircle className="w-4 h-4" />,
      color: 'from-emerald-active to-sea-green',
    },
    {
      id: 'Core',
      label: 'Core System',
      icon: <Cpu className="w-4 h-4" />,
      color: 'from-aquamarine-accent to-emerald-active',
    },
  ];

  return (
    <div id="mode-island-container" className="flex flex-col items-center">
      <motion.div
        id="mode-island-pill"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className="relative flex items-center gap-1.5 p-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-emerald-900/20 group"
      >
        {/* Connection status dot */}
        <div className="flex items-center gap-2 pl-3 pr-2 border-r border-white/10">
          <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-pulse ${isConnected ? 'bg-emerald-active' : 'bg-red-500'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-active' : 'bg-red-500'}`}></span>
          </span>
          <span className="text-[10px] font-mono tracking-wider font-semibold uppercase text-slate-400 select-none hidden md:inline">
            {isConnected ? 'KINETIX ONLINE' : 'SENSOR PAUSED'}
          </span>
        </div>

        {/* Mode buttons */}
        <div className="flex items-center gap-1 relative">
          {modes.map((mode) => {
            const isActive = currentMode === mode.id;
            return (
              <button
                id={`mode-button-${mode.id}`}
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                className={`relative flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 z-10 cursor-pointer ${
                  isActive
                    ? 'text-[#7FFFD4] border border-emerald-500/30 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {mode.icon}
                <span className="relative">{mode.label.toUpperCase()}</span>
              </button>
            );
          })}
        </div>

        {/* Small branding badge */}
        <div className="flex items-center gap-1.5 pl-2 pr-4 border-l border-white/10 select-none text-[11px] font-mono">
          <Radio className="w-3.5 h-3.5 text-sea-green animate-pulse" />
          <span className="text-slate-500">v1.2</span>
        </div>
      </motion.div>
    </div>
  );
}
