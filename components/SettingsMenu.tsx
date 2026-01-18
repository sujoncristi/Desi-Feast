
import React from 'react';
import { motion as m } from 'framer-motion';
import { GameSettings } from '../types';
import { CREATOR_INFO } from '../constants';

const motion = m as any;

interface SettingsMenuProps {
  settings: GameSettings;
  onUpdate: (settings: GameSettings) => void;
  onReset: () => void;
  onClose: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ settings, onUpdate, onReset, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-3xl font-black text-orange-950 mb-8 font-bubbly">Settings</h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-bold text-slate-800 text-lg">Sound Effects</span>
              <span className="text-sm text-slate-500">Play "pops" and "swaps"</span>
            </div>
            <button
              onClick={() => onUpdate({ ...settings, soundEnabled: !settings.soundEnabled })}
              className={`w-16 h-10 rounded-full transition-colors relative flex items-center px-1
                ${settings.soundEnabled ? 'bg-orange-600' : 'bg-slate-300'}`}
            >
              <motion.div
                animate={{ x: settings.soundEnabled ? 24 : 0 }}
                className="w-8 h-8 bg-white rounded-full shadow-md"
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-bold text-slate-800 text-lg">Kitchen Music</span>
              <span className="text-sm text-slate-500">Traditional Desi beats</span>
            </div>
            <button
              onClick={() => onUpdate({ ...settings, musicEnabled: !settings.musicEnabled })}
              className={`w-16 h-10 rounded-full transition-colors relative flex items-center px-1
                ${settings.musicEnabled ? 'bg-orange-600' : 'bg-slate-300'}`}
            >
              <motion.div
                animate={{ x: settings.musicEnabled ? 24 : 0 }}
                className="w-8 h-8 bg-white rounded-full shadow-md"
              />
            </button>
          </div>

          <div className="h-px bg-slate-100" />

          <div className="flex flex-col gap-2">
            <span className="font-bold text-slate-800 text-lg">Game Progress</span>
            <button
              onClick={() => {
                if (confirm("Reset all progress? This cannot be undone.")) {
                  onReset();
                }
              }}
              className="w-full py-4 px-6 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <span>🗑️</span> Reset Levels
            </button>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col items-center gap-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Game Creator</div>
            <div className="text-lg font-black text-orange-950 font-bubbly">{CREATOR_INFO.name}</div>
            <a 
                href={`https://facebook.com/${CREATOR_INFO.facebook}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-pink-500 text-sm font-bold hover:underline"
            >
                FB: {CREATOR_INFO.facebook}
            </a>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-4 bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-500 transition-all active:scale-95"
        >
          Back to Game
        </button>
      </motion.div>
    </motion.div>
  );
};

export default SettingsMenu;
