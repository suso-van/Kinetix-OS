import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, RotateCcw } from 'lucide-react';
import { GestureMapping, Gesture, ActionOption, ControlMode } from '../types';
import LucideIcon from './LucideIcon';

interface MappingCanvasProps {
  currentMode: ControlMode;
  mappings: GestureMapping[];
  gestures: Gesture[];
  actions: ActionOption[];
  onUpdateMapping: (mappingId: string, updates: Partial<GestureMapping>) => void;
  onDeleteMapping: (mappingId: string) => void;
  activeTriggeredId: string | null; // Id of the gesture which was just triggered, to flash animation!
  onTriggerGestureSimulate: (gestureId: string) => void;
  onForgeClick?: () => void;
  onResetClick?: () => void;
}

export default function MappingCanvas({
  currentMode,
  mappings,
  gestures,
  actions,
  onUpdateMapping,
  onDeleteMapping,
  activeTriggeredId,
  onTriggerGestureSimulate,
  onForgeClick,
  onResetClick,
}: MappingCanvasProps) {
  // State for active popover dropdowns
  // Key: mappingId, Value: true/false
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Find objects
  const getGestureForMapping = (mapping: GestureMapping) => {
    return gestures.find((g) => g.id === mapping.gestureId);
  };

  const getActionForMapping = (mapping: GestureMapping) => {
    return actions.find((a) => a.id === mapping.actionId);
  };

  const activeMapping = activePopoverId ? mappings.find((m) => m.id === activePopoverId) : null;
  const activeGesture = activeMapping ? getGestureForMapping(activeMapping) : null;
  const activeAction = activeMapping ? getActionForMapping(activeMapping) : null;

  // Get actions filterable by current Mode category
  const filteredActions = actions.filter((action) => {
    const matchesSearch = action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          action.description.toLowerCase().includes(searchQuery.toLowerCase());
    return action.category === currentMode && matchesSearch;
  });

  return (
    <div id="gesture-mappings-board" className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-3 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
            <span className="text-sea-green italic font-black">⚡</span> Gestural Connective Synapsis
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-lg">
            Map spatial camera coordinate gestures directly to target macro triggers. Click on an action node to swap triggers dynamically.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono bg-white/[0.02] border border-white/5 px-2.5 py-1 rounded-full">
            <span className="flex h-1.5 w-1.5 rounded-full bg-aquamarine-accent animate-ping"></span>
            <span>Adaptive Mapping Active</span>
          </div>

          {onForgeClick && (
            <button
              id="forge-link-button"
              onClick={onForgeClick}
              className="px-4 py-1.5 bg-gradient-to-r from-sea-green to-aquamarine-accent hover:shadow-[0_0_15px_rgba(32,178,170,0.4)] text-[#0a111a] rounded-full text-xs font-display font-semibold transition-all duration-300 flex items-center gap-1.5 hover:scale-[1.02] cursor-pointer shadow-[0_3px_12px_rgba(32,178,170,0.2)]"
            >
              <Plus size={14} /> Forge Linkage
            </button>
          )}

          {onResetClick && (
            <button
              id="reset-presets-btn"
              onClick={onResetClick}
              className="p-1.5 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Reset Mappings to Pre-Configured Presets"
            >
              <RotateCcw size={14} className="hover:animate-spin" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of mappings */}
      <div className="space-y-4">
        {mappings.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-navy-border/40 text-center text-gray-500">
            <p className="text-sm font-medium">No actions mapped for {currentMode} mode.</p>
            <p className="text-xs mt-1">Click below to create custom gesture integrations.</p>
          </div>
        ) : (
          mappings.map((mapping, idx) => {
            const gesture = getGestureForMapping(mapping);
            const action = getActionForMapping(mapping);
            const isFlashed = activeTriggeredId === mapping.gestureId && mapping.isActive;

            if (!gesture || !action) return null;

            return (
              <motion.div
                id={`mapping-synapse-card-${mapping.id}`}
                key={mapping.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={`relative p-5 rounded-2xl border transition-all duration-300 ${
                  activePopoverId === mapping.id ? 'z-50 ring-1 ring-[#20b2aa]/30 shadow-[0_12px_40px_rgba(0,0,0,0.5)] bg-slate-950/40' : 'z-10'
                } ${
                  isFlashed
                    ? 'border-emerald-active bg-emerald-active/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                    : 'border-white/10 bg-white/[0.03] backdrop-blur-md hover:border-sea-green/45 hover:bg-white/[0.07] hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]'
                }`}
              >
                {/* Synaptic mapping header layout */}
                <div className="flex flex-col 2xl:flex-row items-stretch 2xl:items-center gap-4 2xl:gap-6">
                  
                  {/* Left: Gesture Node */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-xl border ${
                        isFlashed
                          ? 'bg-emerald-active/20 border-emerald-active text-emerald-active shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                          : 'bg-slate-950/70 border-white/10 text-sea-green group-hover:border-sea-green/50'
                      } ${!mapping.isActive ? 'opacity-40' : ''} transition-all duration-300`}>
                        <LucideIcon name={gesture.iconName} size={20} className={isFlashed ? 'animate-bounce' : ''} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-display font-bold text-sm tracking-tight ${!mapping.isActive ? 'text-slate-500 line-through' : 'text-white'}`}>
                            {gesture.name}
                          </h3>
                          <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                            gesture.category === 'motion'
                              ? 'border-sea-green/30 bg-sea-green/10 text-sea-green font-semibold'
                              : gesture.category === 'finger'
                              ? 'border-aquamarine-accent/35 bg-aquamarine-accent/10 text-aquamarine-accent font-semibold'
                              : 'border-purple-500/30 bg-purple-500/10 text-purple-300 font-semibold'
                          }`}>
                            {gesture.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {gesture.description}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            id={`sim-trigger-${gesture.id}`}
                            onClick={() => onTriggerGestureSimulate(gesture.id)}
                            disabled={!mapping.isActive}
                            className={`px-2.5 py-1 rounded-xl text-[10px] uppercase font-mono tracking-wider border transition-colors cursor-pointer ${
                              !mapping.isActive
                                ? 'border-gray-800 text-gray-600 bg-transparent cursor-not-allowed'
                                : 'border-[#20b2aa]/30 text-sea-green hover:bg-[#20b2aa]/15 bg-slate-950/50 active:scale-95'
                            }`}
                          >
                            ⚡ Fire Test
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Node: Animated Bioluminescent SVG fiber-line */}
                  <div className="hidden 2xl:flex flex-col items-center justify-center w-24 relative select-none">
                    <div className="absolute top-1 text-[9px] font-mono text-slate-500 tracking-wider">
                      {mapping.isActive ? 'SYNAPSE' : 'DISRUPTED'}
                    </div>
                    <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 24" fill="none">
                      {/* Glow backing */}
                      <path
                        d="M 0 12 H 100"
                        stroke={mapping.isActive ? (isFlashed ? '#10b981' : '#20b2aa') : '#374151'}
                        strokeWidth="2"
                        strokeOpacity={mapping.isActive ? "0.15" : "0.05"}
                        strokeLinecap="round"
                      />
                      {/* Interactive fiber curve */}
                      <motion.path
                        d="M 0 12 C 30 20, 70 4, 100 12"
                        stroke={mapping.isActive ? (isFlashed ? '#10b981' : '#20b2aa') : '#1f2937'}
                        strokeWidth="1.5"
                        strokeOpacity={mapping.isActive ? "0.6" : "0.2"}
                        fill="none"
                        strokeDasharray={mapping.isActive ? "4 8" : undefined}
                        animate={mapping.isActive ? { strokeDashoffset: [-24, 0] } : {}}
                        transition={{ repeat: Infinity, ease: "linear", duration: isFlashed ? 0.4 : 1.5 }}
                      />
                      {/* Laser beacon dash on trigger */}
                      {isFlashed && mapping.isActive && (
                        <motion.circle
                          cx="0"
                          cy="12"
                          r="4"
                          fill="#7fffd4"
                          className="shadow-[0_0_15px_#7fffd4]"
                          animate={{ cx: [0, 100] }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                        />
                      )}
                    </svg>
                    <span className="text-[10px] font-mono text-slate-400 mt-1">
                      {mapping.isActive ? `${mapping.sensitivity}% SENS` : 'DISABLED'}
                    </span>
                  </div>

                  {/* Right: Action Node trigger card */}
                  <div className="flex-1 relative min-w-[200px]">
                    <button
                      id={`popover-trigger-${mapping.id}`}
                      onClick={() => mapping.isActive && setActivePopoverId(mapping.id)}
                      disabled={!mapping.isActive}
                      className={`w-full text-left p-4 rounded-xl border flex items-center justify-between gap-3 group/btn transition-all duration-300 ${
                        !mapping.isActive
                          ? 'border-gray-800 bg-slate-950/10 cursor-not-allowed opacity-40'
                          : isFlashed
                          ? 'border-emerald-active bg-emerald-active/10 text-emerald-active shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                          : 'border-white/10 bg-white/[0.03] backdrop-blur-md text-white hover:border-[#20b2aa]/40 hover:bg-white/[0.08] cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${
                          isFlashed ? 'bg-emerald-active-5 rounded-lg border-emerald-active text-emerald-active' : 'bg-slate-950/90 border-[#20b2aa]/10 text-aquamarine-accent'
                        }`}>
                          <LucideIcon name={action.iconName} size={16} />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-sea-green block mb-0.5">
                            Executed Trigger
                          </span>
                          <span className="font-display font-semibold text-xs tracking-tight group-hover/btn:text-aquamarine-accent transition-colors">
                            {action.name}
                          </span>
                        </div>
                      </div>
                      {mapping.isActive && (
                        <LoaderIcon className="w-4 h-4 text-slate-400 group-hover/btn:text-sea-green group-hover/btn:translate-y-0.5 transition-all animate-none" />
                      )}
                    </button>
                  </div>

                  {/* Far right: Controls Panel */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-3 2xl:border-t-0 2xl:pt-0 2xl:w-44 2xl:justify-end gap-3 font-mono">
                    
                    {/* Status Log of fires */}
                    <div className="text-left 2xl:text-right text-xs shrink-0">
                      <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Fired Count</span>
                      <span className="text-white font-bold">
                        {mapping.timesTriggered} <span className="text-[10px] text-slate-500 font-normal">t</span>
                      </span>
                    </div>

                    {/* Sensitivity tuning slider */}
                    <div className="flex-1 2xl:flex-none flex items-center gap-1.5 min-w-[70px] max-w-[150px]">
                      <SliderIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        id={`sens-slider-${mapping.id}`}
                        type="range"
                        min="20"
                        max="100"
                        value={mapping.sensitivity}
                        onChange={(e) => onUpdateMapping(mapping.id, { sensitivity: parseInt(e.target.value) })}
                        disabled={!mapping.isActive}
                        className={`w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer focus:outline-none accent-sea-green ${
                          !mapping.isActive ? 'accent-gray-700 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>

                    {/* Rightmost: Power switch & Delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        id={`toggle-power-${mapping.id}`}
                        onClick={() => onUpdateMapping(mapping.id, { isActive: !mapping.isActive })}
                        className={`relative w-9 h-5 rounded-full transition-colors duration-300 cursor-pointer shrink-0 ${
                          mapping.isActive ? 'bg-emerald-active' : 'bg-slate-800'
                        }`}
                      >
                        <motion.div
                          className="w-4 h-4 bg-slate-950 rounded-full absolute top-0.5 left-0.5"
                          animate={{ x: mapping.isActive ? 16 : 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </button>

                      {/* Delete custom triggers */}
                      {mapping.id.startsWith('custom_') && (
                        <button
                          id={`delete-mapping-${mapping.id}`}
                          onClick={() => onDeleteMapping(mapping.id)}
                          className="p-1 px-1.5 border border-red-500/10 text-red-400 rounded-lg hover:border-red-500/30 hover:bg-red-500/5 transition-colors cursor-pointer"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Centered Modal Action Picker to prevent any overlap issues */}
      <AnimatePresence>
        {activePopoverId && activeMapping && activeGesture && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#050a0f]/85 backdrop-blur-md z-50 cursor-pointer"
              onClick={() => {
                setActivePopoverId(null);
                setSearchQuery('');
              }}
            />

            {/* Modal Box Container */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none pointer-events-none">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="bg-slate-950/95 border border-white/10 rounded-3xl p-6 shadow-[0_16px_40px_rgba(0,0,0,0.85)] max-w-md w-full relative overflow-hidden pointer-events-auto backdrop-blur-2xl"
              >
                {/* Cyber decorative gradient backdrop */}
                <div className="absolute top-0 right-0 h-28 w-28 bg-gradient-to-br from-[#20b2aa]/15 to-transparent blur-xl pointer-events-none" />

                {/* Header of Popup */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#20b2aa]/15">
                  <div>
                    <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <span className="text-sea-green">⚡</span> Synapse Configuration
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Assign core action for gesture: <span className="text-[#7FFFD4] font-semibold">{activeGesture.name}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActivePopoverId(null);
                      setSearchQuery('');
                    }}
                    className="p-1 px-1.5 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-mono font-bold">Close</span>
                  </button>
                </div>

                {/* Info block */}
                <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5 text-[11px] text-gray-300 leading-normal flex items-start gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-[#20b2aa]/10 text-sea-green shrink-0">
                    <LucideIcon name={activeGesture.iconName} size={14} />
                  </div>
                  <p>
                    When you perform the <span className="font-bold text-white">{activeGesture.name}</span> gesture, the system will immediately execute the corresponding trigger of your choice.
                  </p>
                </div>

                {/* Search field */}
                <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-white/10">
                  <SearchIcon className="w-4 h-4 text-sea-green shrink-0" />
                  <input
                    type="text"
                    placeholder="Search target actions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs bg-transparent text-white placeholder-slate-500 focus:outline-none border-none py-1 pointer-events-auto"
                    autoFocus
                  />
                </div>

                {/* Scalable scroll list of target actions */}
                <div className="overflow-y-auto space-y-1.5 pr-1 max-h-[280px] min-h-[145px] flex-1">
                  {filteredActions.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-500">No actions matched your filter.</p>
                      <p className="text-[10px] text-slate-600 font-mono mt-1">Try typing another keyword.</p>
                    </div>
                  ) : (
                    filteredActions.map((act) => {
                      const isSelected = activeMapping.actionId === act.id;
                      return (
                        <button
                          key={act.id}
                          onClick={() => {
                            onUpdateMapping(activeMapping.id, { actionId: act.id });
                            setActivePopoverId(null);
                            setSearchQuery('');
                          }}
                          className={`w-full text-left p-3 rounded-xl text-xs flex items-center justify-between border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#20b2aa]/15 text-white border-[#20b2aa]/40 shadow-[0_0_15px_rgba(32,178,170,0.1)]'
                              : 'bg-white/[0.01] border-white/5 hover:border-[#20b2aa]/30 hover:bg-white/[0.04] text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg border shrink-0 ${
                              isSelected ? 'bg-sea-green/20 border-sea-green text-aquamarine-accent' : 'bg-slate-950/60 border-[#20b2aa]/10 text-sea-green'
                            }`}>
                              <LucideIcon name={act.iconName} size={14} />
                            </div>
                            <div className="text-left">
                              <p className="font-bold tracking-tight text-white">{act.name}</p>
                              <p className="text-[10px] text-slate-400 font-normal mt-0.5 line-clamp-1">{act.description}</p>
                            </div>
                          </div>
                          {isSelected && <CheckIcon className="w-4 h-4 text-aquamarine-accent shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer and mode confirmation */}
                <div className="pt-3 mt-4 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-slate-400">
                  <span>SYSTEM MODE: <span className="text-[#7FFFD4] font-bold uppercase">{currentMode}</span></span>
                  <span>{filteredActions.length} Actions Available</span>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Inline specific icons to remain extremely safe and self-contained
function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function LoaderIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function SearchIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function TrashIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function SliderIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
  );
}
