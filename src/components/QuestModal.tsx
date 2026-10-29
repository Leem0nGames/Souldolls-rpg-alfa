import React from 'react';
import { Quest } from '../types';
import { X, Scroll, Award, CheckCircle } from 'lucide-react';
import { soundManager } from '../audio/sound';

interface QuestModalProps {
  quest: Quest;
  onClose: () => void;
  onAccept: (questId: string) => void;
  onComplete: (questId: string) => void;
}

export const QuestModal: React.FC<QuestModalProps> = ({ quest, onClose, onAccept, onComplete }) => {
  const canComplete = quest.status === 'active' && quest.currentCount >= quest.targetCount;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold">
              <Scroll className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">{quest.title}</h2>
              <span className="text-xs text-indigo-400 font-mono">Given by {quest.npcName}</span>
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
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* NPC Dialogue Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex gap-4 items-start">
            <div className="w-12 h-12 rounded-full bg-emerald-900/40 border border-emerald-500/40 flex items-center justify-center text-xl shrink-0">
              🧝‍♂️
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">{quest.npcName}</span>
              <p className="text-sm text-slate-300 leading-relaxed">
                "{quest.description}"
              </p>
            </div>
          </div>

          {/* Objectives */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quest Objectives</h3>
            <div className="flex items-center justify-between text-sm text-slate-200">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                {quest.objectiveText}
              </span>
              <span className="font-mono font-bold text-indigo-400 tabular-nums">
                {quest.currentCount} / {quest.targetCount}
              </span>
            </div>
          </div>

          {/* Rewards */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              Rewards
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-indigo-300">
                <span>✨ {quest.reward.xp} XP</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-amber-300">
                <span>🪙 {quest.reward.gold} Gold</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-300 text-sm font-semibold transition-all"
          >
            Close
          </button>
          {quest.status === 'available' && (
            <button
              onClick={() => {
                soundManager.playClick();
                onAccept(quest.id);
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold shadow-lg transition-all"
            >
              Accept Quest
            </button>
          )}
          {canComplete && (
            <button
              onClick={() => {
                soundManager.playClick();
                onComplete(quest.id);
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg flex items-center gap-2 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              Complete Quest
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
