export const rarityValues = ['common', 'rare', 'epic', 'legendary', 'mythic'] as const;
export const sourceStatusValues = ['canon', 'popular_variant', 'uncertain'] as const;
export const activeRollStatusValues = ['active', 'claimed', 'expired'] as const;
export const inventorySortValues = ['rarity', 'quantity', 'recent', 'alphabetical'] as const;

export type Rarity = (typeof rarityValues)[number];
export type SourceStatus = (typeof sourceStatusValues)[number];
export type ActiveRollStatus = (typeof activeRollStatusValues)[number];
export type InventorySort = (typeof inventorySortValues)[number];

export interface Brainrot {
  id: string;
  name: string;
  slug: string;
  rarity: Rarity;
  imageUrl: string;
  description: string;
  sourceStatus: SourceStatus;
  aliases: string[];
}

export interface BrainrotRecord extends Brainrot {
  databaseId: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiscordUserSnapshot {
  discordUserId: string;
  username: string;
  globalName: string | null;
}

export interface PlayerRecord {
  id: number;
  discordUserId: string;
  username: string;
  globalName: string | null;
  lastRollAt: string | null;
  lastClaimAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GuildRecord {
  id: number;
  discordGuildId: string;
  configuredChannelId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerGuildRecord {
  id: number;
  playerId: number;
  guildId: number;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerWishRecord {
  id: number;
  playerId: number;
  brainrotId: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerFavoriteRecord {
  id: number;
  playerId: number;
  brainrotId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveRollRecord {
  id: number;
  guildId: number;
  channelId: string;
  messageId: string | null;
  brainrotId: number;
  rolledByPlayerId: number;
  status: ActiveRollStatus;
  createdAt: string;
  expiresAt: string;
  claimedByPlayerId: number | null;
  claimedAt: string | null;
  updatedAt: string;
}

export interface ActiveRollWithBrainrot extends ActiveRollRecord {
  brainrot: BrainrotRecord;
  rolledByDiscordUserId: string;
  claimedByDiscordUserId: string | null;
}

export interface InventoryEntry {
  brainrot: BrainrotRecord;
  quantity: number;
  isFavorite: boolean;
  firstObtainedAt: string;
  lastObtainedAt: string;
}

export interface PlayerProfileStats {
  totalBrainrots: number;
  uniqueBrainrots: number;
  rarityScore: number;
  score: number;
  wishCount: number;
  favoriteCount: number;
  highestOwnedRarity: Rarity | null;
  lastObtainedBrainrot: BrainrotRecord | null;
  lastObtainedAt: string | null;
}

export interface LeaderboardEntry {
  playerId: number;
  discordUserId: string;
  username: string;
  globalName: string | null;
  totalBrainrots: number;
  uniqueBrainrots: number;
  rarityScore: number;
  score: number;
}

export interface CooldownSnapshot {
  rollRemainingMs: number;
  claimRemainingMs: number;
  rollReadyAt: string | null;
  claimReadyAt: string | null;
}

export interface WishRollHighlight {
  totalWishers: number;
  mentionedDiscordUserIds: string[];
  mentionText: string | null;
}

export function isRarity(value: unknown): value is Rarity {
  return typeof value === 'string' && rarityValues.includes(value as Rarity);
}

export function isSourceStatus(value: unknown): value is SourceStatus {
  return typeof value === 'string' && sourceStatusValues.includes(value as SourceStatus);
}

export function isInventorySort(value: unknown): value is InventorySort {
  return typeof value === 'string' && inventorySortValues.includes(value as InventorySort);
}

export function isActiveRollStatus(value: unknown): value is ActiveRollStatus {
  return typeof value === 'string' && activeRollStatusValues.includes(value as ActiveRollStatus);
}
