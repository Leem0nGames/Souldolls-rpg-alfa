import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Home } from 'lucide-react';
import { soundManager } from '../audio/sound';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onRestart, muted, onToggleMute }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-8 flex flex-col items-center text-center">
        <h2 className="text-2xl font-black text-slate-100 tracking-wide mb-2">GAME PAUSED</h2>
        <p className="text-slate-400 text-sm mb-8">Take a breather, hero.</p>

        <div className="w-full space-y-3">
          <button
            onClick={() => {
              soundManager.playClick();
              onResume();
            }}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            Resume Game
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              onToggleMute();
            }}
            className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            {muted ? 'Unmute Audio' : 'Mute Audio'}
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              onRestart();
            }}
            className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-red-400 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Return to Title
          </button>
        </div>
      </div>
    </div>
  );
};
