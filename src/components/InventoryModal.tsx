import React from 'react';
import { PlayerStats, InventoryItem } from '../types';
import { X, Backpack, Shield, Sword, Coins, Zap, Heart } from 'lucide-react';
import { soundManager } from '../audio/sound';

interface InventoryModalProps {
  stats: PlayerStats;
  inventory: InventoryItem[];
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ stats, inventory, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              <Backpack className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Character & Inventory</h2>
              <span className="text-xs text-emerald-400 font-mono">Level {stats.level} SoulDoll</span>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto">
          {/* Stats Panel */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Character Attributes</h3>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 flex items-center gap-2"><Heart className="w-4 h-4 text-red-400" /> Max HP</span>
                <span className="font-bold text-slate-200 tabular-nums">{stats.maxHp}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 flex items-center gap-2"><Zap className="w-4 h-4 text-blue-400" /> Max Mana</span>
                <span className="font-bold text-slate-200 tabular-nums">{stats.maxMana}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 flex items-center gap-2"><Sword className="w-4 h-4 text-amber-400" /> Attack Power</span>
                <span className="font-bold text-slate-200 tabular-nums">{stats.attackPower}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 flex items-center gap-2"><Shield className="w-4 h-4 text-indigo-400" /> Defense</span>
                <span className="font-bold text-slate-200 tabular-nums">{stats.defense}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 flex items-center gap-2"><Coins className="w-4 h-4 text-yellow-400" /> Gold</span>
                <span className="font-bold text-yellow-300 tabular-nums">{stats.gold}</span>
              </div>
            </div>
          </div>

          {/* Inventory Grid */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Bag Slots (16)</h3>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 16 }).map((_, idx) => {
                const invItem = inventory.find((i) => i.slotIndex === idx);
                return (
                  <div
                    key={idx}
                    className="aspect-square bg-slate-900 border-2 border-slate-800 hover:border-indigo-500/60 rounded-xl flex flex-col items-center justify-center relative transition-all group"
                  >
                    {invItem ? (
                      <>
                        <span className="text-2xl group-hover:scale-110 transition-transform">{invItem.item.icon}</span>
                        {invItem.count > 1 && (
                          <span className="absolute bottom-1 right-1.5 text-[10px] font-mono font-bold text-indigo-300 tabular-nums">
                            {invItem.count}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-700">{idx + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
