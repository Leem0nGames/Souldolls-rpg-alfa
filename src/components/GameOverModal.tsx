import React from 'react';
import { RotateCcw, Skull } from 'lucide-react';
import { soundManager } from '../audio/sound';

interface GameOverModalProps {
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ onRestart }) => {
  return (
    <div className="fixed inset-0 z-50 bg-red-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-slate-900 border-2 border-red-500/50 rounded-2xl w-full max-w-md shadow-2xl p-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mb-4 animate-bounce">
          <Skull className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-red-400 tracking-wide mb-2">YOU HAVE FALLEN</h2>
        <p className="text-slate-400 text-sm mb-8">Your soul doll was defeated in combat. Regroup and try again.</p>
        <button
          onClick={() => {
            soundManager.playClick();
            onRestart();
          }}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-base shadow-lg flex items-center justify-center gap-2 transition-all"
        >
          <RotateCcw className="w-5 h-5" />
          Respawn / Title
        </button>
      </div>
    </div>
  );
};
