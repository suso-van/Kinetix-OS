import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gesture, ActionOption, ControlMode } from '../types';
import LucideIcon from './LucideIcon';
import { X, Plus, Terminal } from 'lucide-react';

interface CustomMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: ControlMode;
  gestures: Gesture[];
  actions: ActionOption[];
  onForgeMapping: (gestureId: string, actionId: string, sensitivity: number) => void;
}

export default function CustomMappingModal({
  isOpen,
  onClose,
  currentMode,
  gestures,
  actions,
  onForgeMapping,
}: CustomMappingModalProps) {
  const [selectedGestureId, setSelectedGestureId] = useState('');
  const [selectedActionId, setSelectedActionId] = useState('');
  const [sensitivity, setSensitivity] = useState(75);

  // Pick actions for the current Mode
  const modeActions = actions.filter((action) => action.category === currentMode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGestureId || !selectedActionId) return;

    onForgeMapping(selectedGestureId, selectedActionId, sensitivity);
    
    // reset
    setSelectedGestureId('');
    setSelectedActionId('');
    setSensitivity(75);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            id="modal-backdrop"
            className="fixed inset-0 bg-[#050a0f]/80 backdrop-blur-md z-50 pointer-events-auto"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              id="custom-mapping-modal-box"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] max-w-lg w-full relative overflow-hidden pointer-events-auto"
            >
              {/* Matrix decor background */}
              <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-[#20b2aa]/10 to-transparent blur-xl pointer-events-none" />

              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#20b2aa]/15">
                <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                  <span className="text-[#7fffd4]"><Plus size={18} /></span> Forge Gesture Linkage
                </h3>
                <button
                  id="close-modal-x"
                  onClick={onClose}
                  className="text-gray-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Mode info banner */}
                <div className="p-3 bg-sea-green/5 rounded-xl border border-sea-green/10 text-xs text-gray-300 leading-normal flex items-start gap-2">
                  <span className="text-sea-green font-bold text-[10px] uppercase font-mono mt-0.5 shrink-0 bg-sea-green/10 px-1.5 py-0.5 rounded">INFO</span>
                  <p>
                    Creating new linkages maps any chosen real-time physical gesture into an action. Target mode: <span className="font-bold text-white">{currentMode} Mode</span>.
                  </p>
                </div>

                {/* 1. SELECT GESTURE */}
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-mono text-[10px] uppercase">1. Pick Spatial Trigger</label>
                  <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                    {gestures.map((gesture) => {
                      const isSelected = selectedGestureId === gesture.id;
                      return (
                        <button
                          id={`modal-gesture-button-${gesture.id}`}
                          type="button"
                          key={gesture.id}
                          onClick={() => setSelectedGestureId(gesture.id)}
                          className={`p-2.5 rounded-xl text-left border flex items-start gap-2.5 transition-all text-xs cursor-pointer ${
                            isSelected
                              ? 'bg-sea-green/15 border-sea-green text-white shadow-[0_0_15px_rgba(32,178,170,0.15)]'
                              : 'bg-white/[0.02] border-white/5 text-slate-300 hover:border-sea-green/45 hover:text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg border shrink-0 ${isSelected ? 'bg-sea-green/20 border-sea-green text-aquamarine-accent' : 'bg-slate-950/40 border-[#20b2aa]/10 text-sea-green'}`}>
                            <LucideIcon name={gesture.iconName} size={14} />
                          </div>
                          <div>
                            <p className="font-bold font-display tracking-tight leading-tight">{gesture.name}</p>
                            <p className="text-[9px] text-gray-500 font-mono mt-0.5 lowercase">Category: {gesture.category}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. SELECT ACTION */}
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-mono text-[10px] uppercase">2. Pick Target Core Action</label>
                  <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                    {modeActions.map((action) => {
                      const isSelected = selectedActionId === action.id;
                      return (
                        <button
                          id={`modal-action-button-${action.id}`}
                          type="button"
                          key={action.id}
                          onClick={() => setSelectedActionId(action.id)}
                          className={`p-2.5 rounded-xl text-left border flex items-start gap-2.5 transition-all text-xs cursor-pointer ${
                            isSelected
                              ? 'bg-sea-green/15 border-sea-green text-white shadow-[0_0_15px_rgba(32,178,170,0.15)]'
                              : 'bg-white/[0.02] border-white/5 text-slate-300 hover:border-sea-green/45 hover:text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg border shrink-0 ${isSelected ? 'bg-sea-green/20 border-sea-green text-aquamarine-accent' : 'bg-slate-950/40 border-[#20b2aa]/10 text-[#7fffd4]'}`}>
                            <LucideIcon name={action.iconName} size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold font-display tracking-tight leading-tight truncate">{action.name}</p>
                            <p className="text-[9px] text-gray-400 mt-0.5 line-clamp-1">{action.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. SENSITIVITY RANGE SLIDER */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-gray-400 text-[10px] uppercase">3. Synaptic Sensitivity</span>
                    <span className="text-sea-green font-bold">{sensitivity}% response depth</span>
                  </div>
                  <input
                    id="modal-sens-slider"
                    type="range"
                    min="30"
                    max="100"
                    value={sensitivity}
                    onChange={(e) => setSensitivity(parseInt(e.target.value))}
                    className="w-full h-1 bg-navy-dark rounded-lg appearance-none cursor-pointer accent-sea-green"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-gray-600 uppercase">
                    <span>Deliberate Swipe (30)</span>
                    <span>Hyper Sensitive Wave (100)</span>
                  </div>
                </div>

                {/* SUBMIT */}
                <div className="flex gap-3 pt-2">
                  <button
                    id="cancel-modal-btn"
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-gray-800 text-xs font-mono text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-synapse-btn"
                    type="submit"
                    disabled={!selectedGestureId || !selectedActionId}
                    className={`flex-1 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                      selectedGestureId && selectedActionId
                        ? 'bg-gradient-to-r from-sea-green to-aquamarine-accent text-navy-dark hover:shadow-[0_0_20px_rgba(32,178,170,0.3)]'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    ⚡ Forge Linkage
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
