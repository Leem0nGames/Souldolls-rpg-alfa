export interface SpellDefinition {
  id: string;
  name: string;
  element: 'fire' | 'holy' | 'arcane';
  manaCost: number;
  cooldown: number; // seconds
  castTime: number; // seconds
  range: number;
  damage: number;
  heal: number;
  description: string;
  icon: string;
}

export const SPELL_CATALOG: Record<string, SpellDefinition> = {
  fireball: {
    id: 'fireball',
    name: 'Orbe Ígneo',
    element: 'fire',
    manaCost: 25,
    cooldown: 1.2,
    castTime: 0.2,
    range: 14,
    damage: 45,
    heal: 0,
    description: 'Lanza un proyectil de fuego concentrado que incinera al objetivo.',
    icon: '🔥',
  },
  heal: {
    id: 'heal',
    name: 'Oración Sanadora',
    element: 'holy',
    manaCost: 30,
    cooldown: 5.0,
    castTime: 0.4,
    range: 0,
    damage: 0,
    heal: 50,
    description: 'Canaliza energía sagrada para restaurar la vitalidad del alma.',
    icon: '✨',
  },
  shockwave: {
    id: 'shockwave',
    name: 'Pulso Arcano',
    element: 'arcane',
    manaCost: 35,
    cooldown: 4.0,
    castTime: 0.1,
    range: 5,
    damage: 30,
    heal: 0,
    description: 'Libera una onda expansiva de energía arcana que daña a todos los enemigos cercanos.',
    icon: '💥',
  },
};
