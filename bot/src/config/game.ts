import type { InventorySort, Rarity } from '../core/types.js';

export const ROLL_COOLDOWN_MS = 0;
export const CLAIM_COOLDOWN_MS = 0;
export const INVENTORY_PAGE_SIZE = 10;
export const ROLL_DELAY_MIN_MS = 0;
export const ROLL_DELAY_MAX_MS = 0;
export const LEADERBOARD_LIMIT = 10;
export const WISHLIST_MAX_ITEMS = 10;
export const WISH_PING_MAX_USERS = 10;

export const rarityScoreMap: Record<Rarity, number> = {
  common: 1,
  rare: 3,
  epic: 10,
  legendary: 25,
  mythic: 60
};

export const rarityWeightMap: Record<Rarity, number> = {
  common: 60,
  rare: 25,
  epic: 10,
  legendary: 4,
  mythic: 1
};

export const rarityColorMap: Record<Rarity, number> = {
  common: 0x71717a,
  rare: 0x2563eb,
  epic: 0x7c3aed,
  legendary: 0xea580c,
  mythic: 0xb91c1c
};

export const rarityLabelMap: Record<Rarity, string> = {
  common: 'Commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
  mythic: 'Mythique'
};

export const rarityOrder: readonly Rarity[] = ['mythic', 'legendary', 'epic', 'rare', 'common'] as const;

export const inventorySortLabelMap: Record<InventorySort, string> = {
  rarity: 'Rareté',
  quantity: 'Quantité',
  recent: 'Récent',
  alphabetical: 'Alphabétique'
};

export function getScoreFromInventory(totalBrainrots: number, uniqueBrainrots: number, rarityScore: number): number {
  return rarityScore + uniqueBrainrots * 10 + totalBrainrots;
}
