import React from 'react';
import { Play, Volume2, VolumeX, Shield, Sparkles } from 'lucide-react';
import { soundManager } from '../audio/sound';

interface TitleScreenProps {
  onStart: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, muted, onToggleMute }) => {
  return (
    <div className="relative w-full h-screen bg-slate-950 flex flex-col items-center justify-between p-8 overflow-hidden select-none">
      {/* Background ambient glow & grid effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-955 pointer-events-none" />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Top Header info */}
      <div className="z-10 flex items-center justify-between w-full max-w-6xl">
        <div className="flex items-center gap-2 text-indigo-400 font-mono text-sm">
          <Shield className="w-5 h-5 text-indigo-400" />
          <span>Luminati Engine 2.5D · Action RPG</span>
        </div>
        <button
          onClick={onToggleMute}
          className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700 hover:border-indigo-500 text-slate-300 transition-all flex items-center gap-2"
        >
          {muted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-xs font-mono">{muted ? 'Muted' : 'Audio On'}</span>
        </button>
      </div>

      {/* Center Hero Title Lockup */}
      <div className="z-10 flex flex-col items-center text-center max-w-3xl my-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-6 animate-pulse">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Classic MMORPG Quest & Combat Experience</span>
        </div>

        {/* Bespoke SVG Title Lockup */}
        <div className="relative mb-6">
          <svg className="w-full max-w-[640px] h-32 drop-shadow-[0_10px_20px_rgba(99,102,241,0.4)]" viewBox="0 0 600 120">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffd700" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="glowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
            </defs>
            <text x="50%" y="55" dominantBaseline="middle" textAnchor="middle" fill="url(#goldGrad)" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="900" fontSize="56" letterSpacing="6">
              SOULDOLLS
            </text>
            <text x="50%" y="95" dominantBaseline="middle" textAnchor="middle" fill="url(#glowGrad)" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="700" fontSize="22" letterSpacing="12">
              CHRONICLES OF LUMINATI
            </text>
          </svg>
        </div>

        <p className="text-slate-400 text-base max-w-xl mb-10 leading-relaxed font-sans">
          Explore the voxel frontier, select targets with Tab or click, complete quests from Elder Thurgan, collect soul relics, and conquer enemies in real-time action combat.
        </p>

        {/* Start CTA Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onStart();
          }}
          className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-lg shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all transform hover:scale-105 active:scale-95 border border-indigo-400/30 cursor-pointer"
        >
          <Play className="w-6 h-6 fill-current text-indigo-200 group-hover:animate-bounce" />
          <span>ENTER THE REALM</span>
        </button>
      </div>

      {/* Control Hint Line at Bottom */}
      <div className="z-10 w-full flex items-center justify-center border-t border-slate-800/80 pt-6">
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5"><kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-300">WASD</kbd> Move</span>
          <span className="flex items-center gap-1.5"><kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-300">Space</kbd> Attack</span>
          <span className="flex items-center gap-1.5"><kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-300">Tab</kbd> Target Enemy</span>
          <span className="flex items-center gap-1.5"><kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-300">1 / 2</kbd> Skills</span>
          <span className="flex items-center gap-1.5"><kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-300">Esc</kbd> Pause</span>
        </div>
      </div>
    </div>
  );
};
