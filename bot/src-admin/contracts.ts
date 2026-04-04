import type {
  ActiveRollRecord,
  ActiveRollStatus,
  BrainrotRecord,
  GuildRecord,
  InventoryEntry,
  LeaderboardEntry,
  PlayerProfileStats,
  PlayerRecord,
  Rarity,
  SourceStatus
} from '../src/core/types.js';

export type BotStatus = 'running' | 'stopped' | 'error' | 'unknown';

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

export interface DataHealthCheck {
  tableCounts: Record<string, number>;
  migrationsApplied: string[];
  orphanedRecords: number;
  inconsistencies: string[];
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

export interface ActiveRollAdminView extends ActiveRollRecord {
  brainrotName?: string;
  brainrotSlug?: string;
  brainrotRarity?: Rarity;
  rolledByUsername?: string;
  claimedByUsername?: string;
}

export type PaginationResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type {
  ActiveRollRecord,
  ActiveRollStatus,
  BrainrotRecord,
  GuildRecord,
  InventoryEntry,
  LeaderboardEntry,
  PlayerProfileStats,
  PlayerRecord,
  Rarity,
  SourceStatus
};
