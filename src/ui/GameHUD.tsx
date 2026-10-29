import React, { useState } from 'react';
import { EngineStats } from '../engine/core/Engine';
import { NPCDialogue } from '../engine/entities/NPC';
import { Shield, Compass, HelpCircle, X, Smartphone, MessageSquare, Sparkles, MapPin, Flame, Heart, Zap, Sword, Scroll, CheckCircle2, AlertCircle } from 'lucide-react';
import { QuestRuntimeState, QuestObjective } from '../engine/quests/QuestData';

interface GameHUDProps {
  stats: EngineStats | null;
  dialogue?: NPCDialogue | null;
  onCloseDialogue?: () => void;
  onInteract?: () => void;
  onCastSpell?: (spellId: string) => void;
  onAttack?: () => void;
  onAcceptQuest?: (questId: string) => void;
  onDeliverQuest?: (questId: string) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  dialogue,
  onCloseDialogue,
  onInteract,
  onCastSpell,
  onAttack,
  onAcceptQuest,
  onDeliverQuest,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showQuestLog, setShowQuestLog] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleCast = (spellId: string) => {
    if (onCastSpell) {
      onCastSpell(spellId);
      setToastMessage(`Hechizo lanzado: ${spellId}`);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const hpPercent = stats ? Math.max(0, Math.min(100, (stats.playerHp / stats.playerMaxHp) * 100)) : 100;
  const manaPercent = stats ? Math.max(0, Math.min(100, (stats.playerMana / stats.playerMaxMana) * 100)) : 100;
  const xpPercent = stats ? Math.max(0, Math.min(100, (stats.playerXp / stats.playerMaxXp) * 100)) : 0;

  const activeQuestsCount = stats?.quests?.filter((q) => q.status === 'active' || q.status === 'completed').length || 0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none p-4 flex flex-col justify-between font-mono">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-2">
        {/* Top-Left: Player Vital Status */}
        <div className="pointer-events-auto flex items-center gap-2.5 pixel-box p-2.5 w-full md:w-auto md:min-w-[220px]">
          <div className="w-10 h-10 bg-[#2A1F2D] border-2 border-[#E8B84A] flex items-center justify-center text-[#FFF9F0] text-base shrink-0">
            🛡️
          </div>
          <div className="flex-1 space-y-0.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#FFF9F0]">
              <span>SoulDoll</span>
              <span className="text-[9px] text-[#E8B84A]">Lv. {stats ? stats.playerLevel : 1}</span>
            </div>
            {/* Health Bar */}
            <div className="w-full bg-[#000000] h-1.5 border border-[#6B5C70] relative overflow-hidden" title={`HP: ${stats?.playerHp}/${stats?.playerMaxHp}`}>
              <div className="bg-[#E23E66] h-full" style={{ width: `${hpPercent}%` }} />
            </div>
            {/* Mana Bar */}
            <div className="w-full bg-[#000000] h-1.5 border border-[#6B5C70] relative overflow-hidden" title={`Mana: ${stats?.playerMana}/${stats?.playerMaxMana}`}>
              <div className="bg-[#0077FF] h-full" style={{ width: `${manaPercent}%` }} />
            </div>
            {/* XP Bar */}
            <div className="w-full bg-[#000000] h-1 border border-[#6B5C70] overflow-hidden" title={`XP: ${stats?.playerXp}/${stats?.playerMaxXp}`}>
              <div className="bg-[#9B6BFF] h-full" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Top-Center: Target Enemy Frame */}
        {stats?.targetInfo && (
          <div className="pointer-events-auto pixel-box p-2.5 w-full md:w-auto md:min-w-[190px]" style={{ borderColor: '#C2234B' }}>
            <div className="flex items-center justify-between text-[11px] font-bold text-[#FF8FB8] mb-0.5">
              <span>{stats.targetInfo.name}</span>
              <span className="text-[9px] text-[#F06060]">Lv. {stats.targetInfo.level}</span>
            </div>
            <div className="w-full bg-[#000000] h-1.5 border border-[#6B5C70] mb-0.5 overflow-hidden">
              <div
                className="bg-[#C2234B] h-full"
                style={{ width: `${Math.max(0, Math.min(100, (stats.targetInfo.hp / stats.targetInfo.maxHp) * 100))}%` }}
              />
            </div>
            <div className="text-[9px] text-[#A89BA8] text-right tabular-nums">
              {stats.targetInfo.hp} / {stats.targetInfo.maxHp} HP
            </div>
          </div>
        )}

        {/* Top-Right: Coordinates, Region, FPS & Controls Info */}
        <div className="pointer-events-auto flex items-center gap-1.5 self-end md:self-auto">
          {/* Coordinates, Region & FPS Pill */}
          <div className="pixel-box px-2.5 py-1.5 text-[#FFF9F0] text-[11px] flex items-center gap-2">
            {stats?.regionName && (
              <div className="flex items-center gap-1 text-[#5FE3D2] font-bold border-r border-[#6B5C70] pr-2 hidden sm:flex">
                <MapPin className="w-3 h-3 text-[#5FE3D2]" />
                <span>{stats.regionName}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-[#00E639]">
              <span className="w-1.5 h-1.5 bg-[#00E639]" />
              <span>{stats ? stats.fps : 60}f</span>
            </div>
            <div className="flex items-center gap-1 text-[#A89BA8]">
              <Compass className="w-3 h-3 text-[#E8B84A]" />
              <span>
                {stats ? stats.playerPos.x : 0},{stats ? stats.playerPos.z : 0}
              </span>
            </div>
          </div>

          {/* Quest Log Button */}
          <button
            onClick={() => setShowQuestLog(true)}
            className="relative p-2 pixel-button text-[#FFF9F0] cursor-pointer"
            title="Diario de Misiones"
          >
            <Scroll className="w-4 h-4 text-[#E8B84A]" />
            {activeQuestsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFAA00] text-[#000000] font-bold text-[9px] border border-[#000000] flex items-center justify-center">
                {activeQuestsCount}
              </span>
            )}
          </button>

          {/* Help Toggle Button */}
          <button
            onClick={() => setShowHelp((prev) => !prev)}
            className="p-2 pixel-button text-[#FFF9F0] cursor-pointer"
            title="Guía de Controles"
          >
            <HelpCircle className="w-4 h-4 text-[#9B6BFF]" />
          </button>
        </div>
      </div>

      {/* Center Toast Message */}
      {toastMessage && (
        <div className="pointer-events-none mx-auto my-auto pixel-box px-4 py-2 text-xs font-bold text-[#E8B84A]">
          {toastMessage}
        </div>
      )}

      {/* Proximity Interaction Prompt (when near NPC) */}
      {stats?.nearNpc && !dialogue && (
        <div className="pointer-events-auto mx-auto my-auto">
          <button
            onClick={onInteract}
            className="flex items-center gap-2.5 px-6 py-3 pixel-button bg-[#3C1C6E] text-[#FFF9F0] font-bold text-xs cursor-pointer border-2 border-[#5FE3D2]"
          >
            <MessageSquare className="w-4 h-4 text-[#E8B84A]" />
            <span>Hablar con Rhogar (Pulsa E)</span>
          </button>
        </div>
      )}

      {/* NPC Dialogue Box (when active) */}
      {dialogue && (
        <div className="pointer-events-auto fixed inset-x-4 bottom-28 md:inset-x-auto md:bottom-20 md:left-1/2 md:-translate-x-1/2 z-40 max-w-lg w-full pixel-box p-5 border-2 border-[#9B6BFF]">
          <div className="flex items-start justify-between pb-2 border-b border-[#3D3242]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#123F3C] border border-[#32A89D] flex items-center justify-center text-lg">
                🧙‍♂️
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#FFF9F0]">{dialogue.name}</h4>
                <span className="text-[10px] text-[#9B6BFF]">{dialogue.title}</span>
              </div>
            </div>
            <button
              onClick={onCloseDialogue}
              className="p-1 pixel-button text-[#A89BA8] hover:text-[#FFF9F0] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-[#FFF9F0] mt-3 leading-relaxed">
            "{dialogue.text}"
          </p>

          {/* Quest Action Buttons inside Dialogue */}
          <div className="mt-4 flex flex-wrap items-center gap-2 justify-end">
            {dialogue.availableQuest && onAcceptQuest && (
              <button
                onClick={() => {
                  onAcceptQuest(dialogue.availableQuest!.id);
                }}
                className="px-4 py-2 pixel-button bg-[#8A6A3B] text-[#FFF9F0] font-bold text-xs cursor-pointer"
              >
                <Scroll className="w-3.5 h-3.5 inline mr-1 text-[#E8B84A]" />
                <span>Aceptar Misión: {dialogue.availableQuest.title}</span>
              </button>
            )}

            {dialogue.completedQuest && onDeliverQuest && (
              <button
                onClick={() => {
                  onDeliverQuest(dialogue.completedQuest!.id);
                }}
                className="px-4 py-2 pixel-button bg-[#2D8C55] text-[#FFF9F0] font-bold text-xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-[#E8B84A]" />
                <span>Reclamar Recompensa</span>
              </button>
            )}

            <button
              onClick={onCloseDialogue}
              className="px-4 py-2 pixel-button bg-[#3C1C6E] text-[#FFF9F0] font-bold text-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 inline mr-1 text-[#E8B84A]" />
              <span>Cerrar</span>
            </button>
          </div>
        </div>
      )}

      {/* Quest Journal Modal */}
      {showQuestLog && (
        <div className="pointer-events-auto fixed inset-0 z-50 bg-[#000000]/80 flex items-center justify-center p-4">
          <div className="pixel-box max-w-lg w-full p-6 space-y-4 max-h-[85vh] flex flex-col border-2 border-[#E8B84A]">
            <div className="flex items-center justify-between pb-3 border-b border-[#3D3242]">
              <h3 className="font-bold text-base text-[#FFF9F0] flex items-center gap-2">
                <Scroll className="w-5 h-5 text-[#E8B84A]" />
                Diario de Misiones (Campaign Quests)
              </h3>
              <button
                onClick={() => setShowQuestLog(false)}
                className="p-1 pixel-button text-[#A89BA8] hover:text-[#FFF9F0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {stats?.quests && stats.quests.length > 0 ? (
                stats.quests.map((q: QuestRuntimeState) => {
                  const statusColors: Record<string, string> = {
                    available: 'border-[#3D3242] bg-[#0B080E] text-[#A89BA8]',
                    active: 'border-[#9B6BFF] bg-[#14101C] text-[#D1BEFF]',
                    completed: 'border-[#2D8C55] bg-[#123F3C] text-[#85EADD]',
                    delivered: 'border-[#3D3242] bg-[#0B080E] text-[#6B5C70] opacity-75',
                  };
                  const statusLabels: Record<string, string> = {
                    available: 'Disponible',
                    active: 'Activa',
                    completed: '¡Completada!',
                    delivered: 'Entregada',
                  };

                  return (
                    <div key={q.id} className={`border-2 rounded-xl p-4 space-y-2 ${statusColors[q.status] || ''}`}>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-[#FFF9F0] flex items-center gap-2">
                          {q.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-[#00E639]" />}
                          {q.status === 'active' && <AlertCircle className="w-4 h-4 text-[#9B6BFF]" />}
                          {q.title}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 bg-[#2A1F2D] border border-[#6B5C70] font-bold uppercase">
                          {statusLabels[q.status]}
                        </span>
                      </div>
                      <p className="text-xs text-[#A89BA8] leading-relaxed">{q.description}</p>

                      {/* Objectives */}
                      <div className="space-y-1 pt-2 border-t border-[#3D3242]">
                        <span className="text-[10px] font-bold text-[#9B6BFF] uppercase tracking-wider">Objetivos:</span>
                        {q.objectives.map((obj: QuestObjective, oIdx: number) => (
                          <div key={oIdx} className="flex items-center justify-between text-xs">
                            <span className={obj.completed ? 'line-through text-[#6B5C70]' : 'text-[#FFF9F0]'}>
                              • {obj.description}
                            </span>
                            <span className={obj.completed ? 'text-[#00E639] font-bold' : 'text-[#FFAA00]'}>
                              {obj.currentCount} / {obj.targetCount}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Rewards */}
                      <div className="text-[11px] text-[#E8B84A] pt-1">
                        🎁 Recompensa: {q.rewards.rewardText}
                      </div>

                      {q.status === 'available' && onAcceptQuest && (
                        <button
                          onClick={() => onAcceptQuest(q.id)}
                          className="mt-2 w-full py-2 pixel-button bg-[#8A6A3B] text-[#FFF9F0] font-bold text-xs cursor-pointer"
                        >
                          Aceptar Misión
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-xs text-[#6B5C70] py-8">No hay misiones disponibles.</div>
              )}
            </div>

            <button
              onClick={() => setShowQuestLog(false)}
              className="w-full py-2.5 pixel-button bg-[#8A6A3B] text-[#FFF9F0] font-bold text-xs cursor-pointer"
            >
              Cerrar Diario
            </button>
          </div>
        </div>
      )}

      {/* Bottom Center: Combat & Magic Hotbar */}
      <div className="flex justify-center w-full">
        <div className="pointer-events-auto flex items-center gap-2 pixel-box p-2">
          {/* Basic Attack */}
          <button
            onClick={onAttack}
            className="w-12 h-12 bg-[#0B080E] border-2 border-[#8A6A3B] hover:border-[#E8B84A] flex flex-col items-center justify-center text-[#FFF9F0] relative group cursor-pointer"
            title="Ataque Básico (Espada)"
          >
            <Sword className="w-5 h-5 text-[#E8B84A]" />
            <span className="absolute bottom-1 right-1.5 text-[9px] text-[#A89BA8]">ATK</span>
          </button>

          {/* Spell 1: Orbe Ígneo (Fireball) */}
          <button
            onClick={() => handleCast('fireball')}
            className="w-12 h-12 bg-[#0B080E] border-2 border-[#8A6A3B] hover:border-[#F06060] flex flex-col items-center justify-center text-[#FFF9F0] relative group cursor-pointer"
            title="Orbe Ígneo (Coste: 25 Mana)"
          >
            <Flame className="w-5 h-5 text-[#F06060]" />
            <span className="absolute top-0.5 right-1 text-[8px] text-[#0077FF]">25M</span>
            <span className="absolute bottom-1 right-1.5 text-[9px] text-[#A89BA8]">1</span>
          </button>

          {/* Spell 2: Oración Sanadora (Heal) */}
          <button
            onClick={() => handleCast('heal')}
            className="w-12 h-12 bg-[#0B080E] border-2 border-[#8A6A3B] hover:border-[#2D8C55] flex flex-col items-center justify-center text-[#FFF9F0] relative group cursor-pointer"
            title="Oración Sanadora (Coste: 30 Mana)"
          >
            <Heart className="w-5 h-5 text-[#2D8C55]" />
            <span className="absolute top-0.5 right-1 text-[8px] text-[#0077FF]">30M</span>
            <span className="absolute bottom-1 right-1.5 text-[9px] text-[#A89BA8]">2</span>
          </button>

          {/* Spell 3: Pulso Arcano (Shockwave) */}
          <button
            onClick={() => handleCast('shockwave')}
            className="w-12 h-12 bg-[#0B080E] border-2 border-[#8A6A3B] hover:border-[#9B6BFF] flex flex-col items-center justify-center text-[#FFF9F0] relative group cursor-pointer"
            title="Pulso Arcano (Coste: 35 Mana)"
          >
            <Zap className="w-5 h-5 text-[#9B6BFF]" />
            <span className="absolute top-0.5 right-1 text-[8px] text-[#0077FF]">35M</span>
            <span className="absolute bottom-1 right-1.5 text-[9px] text-[#A89BA8]">3</span>
          </button>
        </div>
      </div>

      {/* Center Modal: Controls Guide (when toggled) */}
      {showHelp && (
        <div className="pointer-events-auto fixed inset-0 z-50 bg-[#000000]/80 flex items-center justify-center p-4">
          <div className="pixel-box max-w-md w-full p-6 space-y-4 border-2 border-[#9B6BFF]">
            <div className="flex items-center justify-between pb-2 border-b border-[#3D3242]">
              <h3 className="font-bold text-base text-[#FFF9F0] flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#9B6BFF]" />
                Guía de Controles, Misiones y Magia
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1 pixel-button text-[#A89BA8] hover:text-[#FFF9F0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quests & NPC */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#E8B84A] uppercase tracking-wider flex items-center gap-1.5">
                <Scroll className="w-4 h-4" /> Misiones y NPCs
              </span>
              <ul className="text-xs text-[#A89BA8] space-y-1 pl-2">
                <li>• <b>Rhogar (NPC):</b> Acércate y pulsa E o el botón táctil para hablar.</li>
                <li>• <b>Diario de Misiones:</b> Pulsa el icono de pergamino superior para revisar metas.</li>
              </ul>
            </div>

            {/* Combat & Magic Info */}
            <div className="space-y-2 pt-2 border-t border-[#3D3242]">
              <span className="text-xs font-bold text-[#9B6BFF] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Sistema de Combate y Magia
              </span>
              <ul className="text-xs text-[#A89BA8] space-y-1 pl-2">
                <li>• <b>Ataque Básico:</b> Golpea con la espada en rango cuerpo a cuerpo.</li>
                <li>• <b>Orbe Ígneo (1):</b> Lanza un proyectil mágico de fuego.</li>
                <li>• <b>Oración Sanadora (2):</b> Restaura HP consumiendo maná.</li>
                <li>• <b>Pulso Arcano (3):</b> Onda de choque AoE para enemigos cercanos.</li>
              </ul>
            </div>

            {/* Mobile Controls Guide */}
            <div className="space-y-2 pt-2 border-t border-[#3D3242]">
              <span className="text-xs font-bold text-[#2D8C55] uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" /> Controles Táctiles
              </span>
              <ul className="text-xs text-[#A89BA8] space-y-1 pl-2">
                <li>• <b>Joystick izquierdo:</b> Movimiento 360°.</li>
                <li>• <b>Arrastre derecho:</b> Rotación de cámara.</li>
              </ul>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-2.5 pixel-button bg-[#3C1C6E] text-[#FFF9F0] font-bold text-xs cursor-pointer mt-2"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
