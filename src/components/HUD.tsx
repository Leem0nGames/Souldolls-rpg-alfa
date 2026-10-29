import React from 'react';
import { PlayerStats, Quest } from '../types';
import { Shield, Backpack, Scroll, Volume2, VolumeX, Pause, Flame, Heart, Sword } from 'lucide-react';

interface HUDProps {
  stats: PlayerStats;
  targetInfo: { name: string; level: number; hp: number; maxHp: number } | null;
  quests: Quest[];
  onOpenInventory: () => void;
  onOpenQuests: () => void;
  onOpenPause: () => void;
  muted: boolean;
  onToggleMute: () => void;
  onSkill: (slot: number) => void;
  onAttack: () => void;
  playerPos: { x: number; z: number };
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  targetInfo,
  quests,
  onOpenInventory,
  onOpenQuests,
  onOpenPause,
  muted,
  onToggleMute,
  onSkill,
  onAttack,
  playerPos,
}) => {
  const activeQuest = quests.find((q) => q.status === 'active' || q.status === 'available');

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 select-none font-sans">
      {/* Top Row: Player Frame, Target Frame, Minimap */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: Player Frame */}
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 shadow-xl backdrop-blur-sm min-w-[260px]">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-800 flex items-center justify-center border border-indigo-400/40 text-white font-bold text-lg shadow-inner">
            🛡️
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm text-slate-100 tracking-wide">TestPlayer</span>
              <span className="text-xs font-mono text-indigo-400 font-semibold">Lv. {stats.level}</span>
            </div>
            {/* HP Bar */}
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800 mb-1">
              <div
                className="bg-red-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
              <span>HP</span>
              <span className="tabular-nums">{stats.hp} / {stats.maxHp}</span>
            </div>
            {/* Mana Bar */}
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 mb-1">
              <div
                className="bg-blue-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(0, Math.min(100, (stats.mana / stats.maxMana) * 100))}%` }}
              />
            </div>
            {/* XP Bar */}
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-indigo-400 h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(0, Math.min(100, (stats.xp / stats.maxXp) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Top-Center: Target Frame (if selected) */}
        {targetInfo && (
          <div className="pointer-events-auto bg-slate-900/90 border border-red-500/50 rounded-xl p-3 shadow-xl backdrop-blur-sm min-w-[220px] animate-fadeIn">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-red-300 uppercase tracking-wider">{targetInfo.name}</span>
              <span className="text-[10px] font-mono text-red-400">Target</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 mb-1">
              <div
                className="bg-red-600 h-full transition-all duration-200 rounded-full"
                style={{ width: `${Math.max(0, Math.min(100, (targetInfo.hp / targetInfo.maxHp) * 100))}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 font-mono text-right tabular-nums">
              {targetInfo.hp} / {targetInfo.maxHp} HP
            </div>
          </div>
        )}

        {/* Top-Right: Minimap & Settings */}
        <div className="flex items-start gap-3">
          {/* Minimap Box */}
          <div className="pointer-events-auto bg-slate-900/90 border border-slate-700/80 rounded-xl p-2 shadow-xl backdrop-blur-sm flex flex-col items-center">
            <div className="w-32 h-32 bg-slate-950 rounded-lg border border-slate-800 relative overflow-hidden flex items-center justify-center">
              {/* Grid lines */}
              <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
              {/* Player dot */}
              <div className="absolute w-3 h-3 bg-indigo-500 rounded-full border border-white shadow-[0_0_6px_#6366f1]" style={{ left: '50%', top: '50%' }} />
              {/* NPC marker */}
              <div className="absolute w-2 h-2 bg-yellow-400 rounded-full" style={{ left: '35%', top: '40%' }} />
              {/* Enemy marker */}
              <div className="absolute w-2 h-2 bg-red-500 rounded-full" style={{ left: '70%', top: '30%' }} />
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1 tabular-nums">
              X: {Math.round(playerPos.x)} Z: {Math.round(playerPos.z)}
            </div>
          </div>

          {/* Utility Buttons */}
          <div className="pointer-events-auto flex flex-col gap-2">
            <button
              onClick={onToggleMute}
              className="p-2.5 bg-slate-900/90 border border-slate-700 hover:border-indigo-500 rounded-xl text-slate-300 shadow-xl transition-all"
              title="Toggle Audio"
            >
              {muted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
            </button>
            <button
              onClick={onOpenPause}
              className="p-2.5 bg-slate-900/90 border border-slate-700 hover:border-indigo-500 rounded-xl text-slate-300 shadow-xl transition-all"
              title="Pause Menu"
            >
              <Pause className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Middle Row: Right-side Active Quest Tracker */}
      <div className="flex justify-end w-full my-auto">
        {activeQuest && (
          <div className="pointer-events-auto bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 shadow-xl backdrop-blur-sm w-72">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800">
              <span className="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
                <Scroll className="w-4 h-4 text-indigo-400" />
                {activeQuest.title}
              </span>
              <span className="text-[10px] font-mono text-yellow-400 uppercase">Active</span>
            </div>
            <p className="text-xs text-slate-300 mb-2 leading-relaxed">{activeQuest.description}</p>
            <div className="text-xs font-mono text-slate-400 flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800">
              <span>{activeQuest.objectiveText}</span>
              <span className="font-bold text-indigo-300 tabular-nums">
                {activeQuest.currentCount} / {activeQuest.targetCount}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Row: Action Bar, Skill Hotbar, Inventory, Quests */}
      <div className="flex items-end justify-between w-full">
        {/* Left: Quest & Inventory Buttons */}
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            onClick={onOpenQuests}
            className="flex items-center gap-2 px-4 py-3 bg-slate-900/90 border border-slate-700 hover:border-indigo-500 rounded-xl text-slate-200 font-bold text-xs shadow-xl transition-all hover:bg-slate-800"
          >
            <Scroll className="w-4 h-4 text-indigo-400" />
            <span>Quests (Q)</span>
          </button>
          <button
            onClick={onOpenInventory}
            className="flex items-center gap-2 px-4 py-3 bg-slate-900/90 border border-slate-700 hover:border-indigo-500 rounded-xl text-slate-200 font-bold text-xs shadow-xl transition-all hover:bg-slate-800"
          >
            <Backpack className="w-4 h-4 text-emerald-400" />
            <span>Inventory (B)</span>
          </button>
        </div>

        {/* Center: Skill Hotbar & Basic Attack */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 p-2 rounded-2xl shadow-2xl backdrop-blur-sm">
          {/* Attack Slot */}
          <button
            onClick={onAttack}
            className="w-12 h-12 bg-slate-950 border-2 border-slate-700 hover:border-indigo-500 rounded-xl flex flex-col items-center justify-center text-slate-200 relative group transition-all"
            title="Basic Attack (Space)"
          >
            <Sword className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="absolute bottom-1 right-1.5 text-[9px] font-mono text-slate-400">SPC</span>
          </button>

          {/* Skill 1: Fireball */}
          <button
            onClick={() => onSkill(1)}
            className="w-12 h-12 bg-slate-950 border-2 border-slate-700 hover:border-indigo-500 rounded-xl flex flex-col items-center justify-center text-slate-200 relative group transition-all"
            title="Fireball (Cost: 20 Mana)"
          >
            <Flame className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
            <span className="absolute bottom-1 right-1.5 text-[9px] font-mono text-slate-400">1</span>
          </button>

          {/* Skill 2: Heal */}
          <button
            onClick={() => onSkill(2)}
            className="w-12 h-12 bg-slate-950 border-2 border-slate-700 hover:border-indigo-500 rounded-xl flex flex-col items-center justify-center text-slate-200 relative group transition-all"
            title="Healing Prayer (Cost: 15 Mana)"
          >
            <Heart className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="absolute bottom-1 right-1.5 text-[9px] font-mono text-slate-400">2</span>
          </button>
        </div>

        {/* Right placeholder for balance */}
        <div className="w-48" />
      </div>
    </div>
  );
};
