/**
 * SOULDOLLS 64-Color Palette
 * 
 * Brand Identity & World Building palette organized by categories.
 * Follows the 80/10/10 rule:
 * - 80% Environment & Neutrals
 * - 10% Characters & Entities
 * - 10% UI & Special FX
 */

export const PALETTE = {
  // 1. Core Brand Colors (9)
  BRAND: {
    CRYPT_INK: '#14101C',      // UI Background, absolute shadows, outlines
    SMOKED_WOOD: '#2A1F2D',    // Burnt wood, dark leather, menu backgrounds
    OLD_BRONZE: '#8A6A3B',     // Base metals, armor, architecture
    RESONANT_GOLD: '#E8B84A',  // Metal shines, coins, holy magic, UI highlights
    PORCELAIN: '#F2E6C9',       // Light skin, white clothes, UI text
    KI_CYAN: '#5FE3D2',         // Energy magic, water, crystals, portals
    SOUL_VIOLET: '#9B6BFF',     // Arcane magic, poison, wizard robes
    RIFT_CRIMSON: '#C2234B',    // Blood, damage, dark magic
    PORCELAIN_PINK: '#FF8FB8',  // Healing, illusion magic, noble clothes
  },

  // 2. Neutrals & Grayscale (6)
  NEUTRAL: {
    VOID_BLACK: '#000000',      // Outlines, UI shadows
    ABYSS_INK: '#0B080E',       // Deep shadows, pits
    ASH_PURPLE: '#3D3242',      // Soft shadows, stone
    COLD_STONE: '#6B5C70',      // Base stone, dungeon walls, worn metal
    BONE_GRAY: '#A89BA8',       // Bones, fog, neutral highlights
    WARM_WHITE: '#FFF9F0',      // Sunlight, fire highlights
  },

  // 3. Woods, Leathers & Bronzes (7)
  WOOD: {
    DARK_OAK: '#3B2B1A',        // Shadowed wood, beams, chests
    BURNT_UMBER: '#5C4227',     // Intermediate wood, leather
    TARNISHED_GOLD: '#A67F46',  // Dirty gold, ruins
    BRIGHT_BRASS: '#F4D073',    // Metal highlights, jewelry
    PALE_GOLD: '#FCEDB8',       // Maximum metal shine
    RUST: '#6E3A1B',            // Rust, dry blood, old weapons
    LEATHER_BROWN: '#7A4F2E',   // Character clothes, belts
  },

  // 4. Reds & Pinks (8)
  VITALITY: {
    DRIED_BLOOD: '#4A0B18',
    BLOOD_MOON: '#6E0C25',
    ROSEWOOD: '#911934',
    RUBY_GLOW: '#E23E66',
    CORAL_RED: '#F06060',
    PEACH_BLUSH: '#FFB3CE',
    PALE_ROSE: '#FFD6E4',
    CHERRY_BLOSSOM: '#FFEBF2',
  },

  // 5. Violets & Magia Arcana (8)
  ARCANE: {
    NIGHTSHADE: '#24123B',
    DEEP_AMETHYST: '#3C1C6E',
    ROYAL_PURPLE: '#5E329E',
    ARCANE_LILAC: '#7F4AD6',
    ETHEREAL_ORCHID: '#B691FF',
    GHOST_VIOLET: '#D1BEFF',
    LAVENDER_MIST: '#F4EFFF',
    HEX_PURPLE: '#6C3B8A',
  },

  // 6. Cianes, Teales y Naturaleza (8)
  AETHER: {
    DARK_SLATE: '#1B2A2A',
    DEEP_ABYSS: '#123F3C',
    OCEANIC_TEAL: '#1F6B65',
    VIBRANT_AQUA: '#32A89D',
    NEON_MINT: '#85EADD',
    ICE_CYAN: '#B8F4EE',
    FROSTED_GLASS: '#D9FBF7',
    EMERALD: '#2D8C55',
  },

  // 7. Entornos, Tilesets y Propios del Mundo (10)
  NATURE: {
    PITCH_BLACK_GREEN: '#10160D',
    FOREST_GREEN: '#2A3D24',
    OLIVE_DRAB: '#4C5C36',
    MOSS_GREEN: '#7A8B3F',
    DIRT_BROWN: '#453322',
    STONE_SHADOW: '#2F3640',
    STONE_MID: '#4B5563',
    STONE_HIGHLIGHT: '#6B778C',
    SAND_DESERT: '#C2A77C',
    WOOD_HIGHLIGHT: '#9E7D5A',
  },

  // 8. Acentos de UI y Efectos Especiales (8)
  UI: {
    DANGER: '#FF0000',
    WARNING: '#FFAA00',
    SUCCESS: '#00E639',
    MANA_INFO: '#0077FF',
    POISON: '#8F00FF',
    GOLD: '#FFD700',
    PURE_WHITE: '#FFFFFF',
  }
} as const;

export type PaletteCategory = keyof typeof PALETTE;

/**
 * Utility to get a color from the palette by category and name.
 */
export function getPaletteColor(category: PaletteCategory, color: string): string {
  const cat = PALETTE[category] as any;
  return cat[color] || '#FF00FF';
}
