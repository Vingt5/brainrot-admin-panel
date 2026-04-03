// Types matching the brainrot-bot domain model

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type SourceStatus = 'canon' | 'popular_variant' | 'uncertain';
export type ActiveRollStatus = 'active' | 'claimed' | 'expired';
export type BotStatus = 'running' | 'stopped' | 'error' | 'unknown';

export interface BrainrotRecord {
  databaseId: number;
  id: string;
  name: string;
  slug: string;
  rarity: Rarity;
  imageUrl: string;
  description: string;
  sourceStatus: SourceStatus;
  aliases: string[];
  createdAt: string;
  updatedAt: string;
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
  brainrotName?: string;
  brainrotSlug?: string;
  brainrotRarity?: Rarity;
  rolledByUsername?: string;
  claimedByUsername?: string;
}

export interface InventoryEntry {
  brainrot: BrainrotRecord;
  quantity: number;
  isFavorite: boolean;
  firstObtainedAt: string;
  lastObtainedAt: string;
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

export interface PlayerProfileStats {
  totalBrainrots: number;
  uniqueBrainrots: number;
  rarityScore: number;
  score: number;
  wishCount: number;
  favoriteCount: number;
  highestOwnedRarity: Rarity | null;
}

export interface DashboardKPIs {
  totalPlayers: number;
  totalGuilds: number;
  totalBrainrots: number;
  totalRolls: number;
  activeRolls: number;
  claimedRolls: number;
  totalInventoryEntries: number;
  totalWishes: number;
  totalFavorites: number;
}

export interface RuntimeStatus {
  status: BotStatus;
  pid: number | null;
  uptime: number | null;
  lastStartedAt: string | null;
  memoryUsageMb: number | null;
}

export interface MaintenanceTask {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt: string | null;
  logs: string[];
  triggeredBy: string;
}

export interface DataHealthCheck {
  tableCounts: Record<string, number>;
  migrationsApplied: string[];
  orphanedRecords: number;
  inconsistencies: string[];
}

export interface BrainrotAdminView extends BrainrotRecord {
  ownerCount: number;
  totalOwned: number;
  wishCount: number;
  favoriteCount: number;
}

export interface PlayerAdminView extends PlayerRecord {
  guildCount: number;
  inventoryCount: number;
  wishCount: number;
  favoriteCount: number;
  score: number;
}
