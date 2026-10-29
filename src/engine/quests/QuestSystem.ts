import { QuestDefinition, QuestStatus, INITIAL_QUESTS, ObjectiveType } from './QuestData';

export interface QuestRuntimeState extends QuestDefinition {
  status: QuestStatus;
}

export class QuestSystem {
  private quests: Map<string, QuestRuntimeState> = new Map();
  public onQuestUpdate?: (quests: QuestRuntimeState[]) => void;
  public onQuestNotification?: (msg: string) => void;

  constructor() {
    INITIAL_QUESTS.forEach((q) => {
      this.quests.set(q.id, {
        ...JSON.parse(JSON.stringify(q)),
        status: 'available',
      });
    });
    this.evaluateAvailability();
  }

  public getAllQuests(): QuestRuntimeState[] {
    return Array.from(this.quests.values());
  }

  public getQuest(id: string): QuestRuntimeState | undefined {
    return this.quests.get(id);
  }

  public evaluateAvailability() {
    for (const [id, quest] of this.quests.entries()) {
      if (quest.status === 'available') {
        if (quest.prerequisites && quest.prerequisites.length > 0) {
          const allPrereqsMet = quest.prerequisites.every((prereqId) => {
            const p = this.quests.get(prereqId);
            return p && p.status === 'delivered';
          });
          if (!allPrereqsMet) {
            continue; // Not available yet
          }
        }
      }
    }
  }

  public acceptQuest(id: string): boolean {
    const q = this.quests.get(id);
    if (!q || q.status !== 'available') return false;

    // Check prerequisites
    if (q.prerequisites) {
      const ok = q.prerequisites.every((pId) => this.quests.get(pId)?.status === 'delivered');
      if (!ok) return false;
    }

    q.status = 'active';
    if (this.onQuestNotification) {
      this.onQuestNotification(`¡Misión aceptada: "${q.title}"!`);
    }
    this.notify();
    return true;
  }

  public updateObjective(type: ObjectiveType, amount = 1, targetId?: string): void {
    for (const q of this.quests.values()) {
      if (q.status !== 'active') continue;

      let qChanged = false;
      for (const obj of q.objectives) {
        if (!obj.completed && obj.type === type) {
          // If targetId is specified, ensure it matches
          if (targetId && obj.targetId && obj.targetId !== targetId) {
            continue;
          }
          obj.currentCount = Math.min(obj.targetCount, obj.currentCount + amount);
          if (obj.currentCount >= obj.targetCount) {
            obj.completed = true;
          }
          qChanged = true;
        }
      }

      if (qChanged) {
        // Check if all objectives are completed
        const allCompleted = q.objectives.every((o) => o.completed);
        if (allCompleted) {
          q.status = 'completed';
          if (this.onQuestNotification) {
            this.onQuestNotification(`¡Misión completada: "${q.title}"! Reúnete con Rhogar.`);
          }
        }
        this.notify();
      }
    }
  }

  public deliverQuest(id: string): { success: boolean; xpReward: number; message: string } {
    const q = this.quests.get(id);
    if (!q || q.status !== 'completed') {
      return { success: false, xpReward: 0, message: 'La misión no está lista para entregar.' };
    }

    q.status = 'delivered';
    this.evaluateAvailability();
    this.notify();

    if (this.onQuestNotification) {
      this.onQuestNotification(`¡Recompensa reclamada por "${q.title}": +${q.rewards.xp} XP!`);
    }

    return {
      success: true,
      xpReward: q.rewards.xp,
      message: q.rewards.rewardText,
    };
  }

  private notify() {
    if (this.onQuestUpdate) {
      this.onQuestUpdate(this.getAllQuests());
    }
  }
}
