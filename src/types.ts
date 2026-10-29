export type GameState = 'title' | 'playing' | 'paused' | 'gameover' | 'victory';

export interface PlayerStats {
  level: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  xp: number;
  maxXp: number;
  gold: number;
  attackPower: number;
  defense: number;
  speed: number;
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'potion' | 'quest';
  icon: string;
  description: string;
  value: number;
  stats?: { attack?: number; defense?: number; heal?: number };
}

export interface InventoryItem {
  item: Item;
  count: number;
  slotIndex: number;
}

export interface Quest {
  id: string;
  title: string;
  npcName: string;
  description: string;
  objectiveText: string;
  targetType: 'defeat' | 'collect' | 'visit';
  targetId: string; // e.g. 'spider' or 'relic' or 'altar'
  targetCount: number;
  currentCount: number;
  reward: { xp: number; gold: number; itemId?: string };
  status: 'available' | 'active' | 'completed' | 'turned_in';
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  z: number;
  color: string;
  life: number; // 0 to 1
}

export interface Particle {
  position: [number, number, number];
  velocity: [number, number, number];
  color: string;
  size: number;
  life: number;
  maxLife: number;
}
