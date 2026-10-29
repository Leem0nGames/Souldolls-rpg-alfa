export type QuestStatus = 'available' | 'active' | 'completed' | 'delivered';

export type ObjectiveType = 'talk_to_npc' | 'defeat_enemies' | 'explore_region' | 'explore_dungeon' | 'defeat_boss';

export interface QuestObjective {
  type: ObjectiveType;
  description: string;
  targetCount: number;
  currentCount: number;
  targetId?: string; // e.g. NPC ID or Region coord string
  completed: boolean;
}

export interface QuestReward {
  xp: number;
  rewardText: string;
}

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  npcId: string;
  prerequisites?: string[]; // IDs of quests that must be delivered first
  objectives: QuestObjective[];
  rewards: QuestReward;
}

export type QuestRuntimeState = QuestDefinition & {
  status: QuestStatus;
};

export const INITIAL_QUESTS: QuestDefinition[] = [
  {
    id: 'quest_talk_rhogar',
    title: 'El Consejo del Sabio',
    description: 'Habla con el anciano Rhogar en el claro inicial para comprender la naturaleza de las almas en Luminati.',
    npcId: 'npc_elder_rhogar',
    objectives: [
      {
        type: 'talk_to_npc',
        description: 'Hablar con Rhogar',
        targetCount: 1,
        currentCount: 0,
        targetId: 'npc_elder_rhogar',
        completed: false,
      },
    ],
    rewards: {
        xp: 50,
        rewardText: '50 Puntos de Experiencia y Sabiduría del Umbral',
    },
  },
  {
    id: 'quest_defeat_slimes',
    title: 'Limpieza de Slimes',
    description: 'Los slimes esmeralda se han vuelto agresivos en los alrededores. Derrota a 2 de ellos para asegurar el camino.',
    npcId: 'npc_elder_rhogar',
    prerequisites: ['quest_talk_rhogar'],
    objectives: [
      {
        type: 'defeat_enemies',
        description: 'Derrotar slimes de bosque',
        targetCount: 2,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
        xp: 100,
        rewardText: '100 Puntos de Experiencia y Bendición del Guardián',
    },
  },
  {
    id: 'quest_explore_region',
    title: 'Exploración del Umbral',
    description: 'Explora y mantén tu posición en la región inicial de llanuras para calibrar tu resonancia mística.',
    npcId: 'npc_elder_rhogar',
    prerequisites: ['quest_defeat_slimes'],
    objectives: [
      {
        type: 'explore_region',
        description: 'Visitar la región de origen [0, 0]',
        targetCount: 1,
        currentCount: 0,
        targetId: '0,0',
        completed: false,
      },
    ],
    rewards: {
        xp: 150,
        rewardText: '150 Puntos de Experiencia y Sintonía Mágica Avanzada',
    },
  },
  {
    id: 'quest_explore_dungeon',
    title: 'Cripta de las Almas Perdidas',
    description: 'Adéntrate en la Cripta de las Almas Perdidas, explora sus profundidades y conquista la oscuridad.',
    npcId: 'npc_elder_rhogar',
    prerequisites: ['quest_explore_region'],
    objectives: [
      {
        type: 'explore_dungeon',
        description: 'Explorar la Cripta de las Almas Perdidas',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
        xp: 300,
        rewardText: '300 Puntos de Experiencia y Reliquia del Umbral',
    },
  },
  {
    id: 'quest_defeat_crypt_guardian',
    title: 'El Guardián Espectral',
    description: 'Derrota al Guardián de la Cripta en el Santuario de las Almas Perdidas para liberar el alma atrapada en el cristal espectral.',
    npcId: 'npc_elder_rhogar',
    prerequisites: ['quest_explore_dungeon'],
    objectives: [
      {
        type: 'defeat_boss',
        description: 'Derrotar al Guardián de la Cripta',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
        xp: 500,
        rewardText: '500 Puntos de Experiencia y Cetro del Alma Liberada',
    },
  },
];
