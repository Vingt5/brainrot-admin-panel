// Mock data for development when API is not available
import type {
  BrainrotAdminView,
  DashboardKPIs,
  DataHealthCheck,
  GuildRecord,
  InventoryEntry,
  ActiveRollRecord,
  PlayerAdminView,
  PlayerProfileStats,
  RuntimeStatus,
  MaintenanceTask,
  LeaderboardEntry,
  Rarity,
} from './types';

const rarities: Rarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];

function randomDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d.toISOString();
}

export const mockBrainrots: BrainrotAdminView[] = [
  { databaseId: 1, id: 'br-bombardiro-crocodilo', name: 'Bombardiro Crocodilo', slug: 'bombardiro-crocodilo', rarity: 'legendary', imageUrl: '', description: 'Un crocodile bombardier légendaire.', sourceStatus: 'canon', aliases: ['bombardiro'], createdAt: '2025-01-15T00:00:00Z', updatedAt: '2025-01-15T00:00:00Z', ownerCount: 12, totalOwned: 18, wishCount: 45, favoriteCount: 8 },
  { databaseId: 2, id: 'br-ballerina-cappuccina', name: 'Ballerina Cappuccina', slug: 'ballerina-cappuccina', rarity: 'rare', imageUrl: '', description: 'Une ballerine en tasse de cappuccino.', sourceStatus: 'canon', aliases: ['ballerina', 'cappuccina'], createdAt: '2025-01-15T00:00:00Z', updatedAt: '2025-01-15T00:00:00Z', ownerCount: 28, totalOwned: 42, wishCount: 15, favoriteCount: 22 },
  { databaseId: 3, id: 'br-brr-brr-patapim', name: 'Brr Brr Patapim', slug: 'brr-brr-patapim', rarity: 'mythic', imageUrl: '', description: 'Le mythique Patapim qui fait brr brr.', sourceStatus: 'canon', aliases: ['patapim'], createdAt: '2025-01-15T00:00:00Z', updatedAt: '2025-01-15T00:00:00Z', ownerCount: 3, totalOwned: 3, wishCount: 89, favoriteCount: 2 },
  { databaseId: 4, id: 'br-cappuccino-assassino', name: 'Cappuccino Assassino', slug: 'cappuccino-assassino', rarity: 'epic', imageUrl: '', description: "Un cappuccino assassin d'élite.", sourceStatus: 'canon', aliases: ['assassino'], createdAt: '2025-01-15T00:00:00Z', updatedAt: '2025-01-15T00:00:00Z', ownerCount: 9, totalOwned: 11, wishCount: 32, favoriteCount: 6 },
  { databaseId: 5, id: 'br-apipipipi', name: 'Apipipipi', slug: 'apipipipi', rarity: 'common', imageUrl: '', description: 'Une flamme à pieds géants.', sourceStatus: 'canon', aliases: [], createdAt: '2025-01-15T00:00:00Z', updatedAt: '2025-01-15T00:00:00Z', ownerCount: 55, totalOwned: 120, wishCount: 2, favoriteCount: 5 },
  { databaseId: 6, id: 'br-gorgonzilla', name: 'Gorgonzilla', slug: 'gorgonzilla', rarity: 'epic', imageUrl: '', description: 'Un monstre fromager terrifiant.', sourceStatus: 'popular_variant', aliases: [], createdAt: '2025-01-15T00:00:00Z', updatedAt: '2025-01-15T00:00:00Z', ownerCount: 7, totalOwned: 9, wishCount: 18, favoriteCount: 4 },
  { databaseId: 7, id: 'br-tralalero-tralala', name: 'Tralalero Tralala', slug: 'tralalero-tralala', rarity: 'common', imageUrl: '', description: 'Un requin à deux pattes.', sourceStatus: 'canon', aliases: ['tralalero'], createdAt: '2025-01-15T00:00:00Z', updatedAt: '2025-01-15T00:00:00Z', ownerCount: 62, totalOwned: 145, wishCount: 1, favoriteCount: 10 },
  { databaseId: 8, id: 'br-tung-tung-tung-sahur', name: 'Tung Tung Tung Sahur', slug: 'tung-tung-tung-sahur', rarity: 'rare', imageUrl: '', description: 'Un cube qui fait tung tung tung.', sourceStatus: 'canon', aliases: ['tung tung'], createdAt: '2025-01-15T00:00:00Z', updatedAt: '2025-01-15T00:00:00Z', ownerCount: 31, totalOwned: 50, wishCount: 12, favoriteCount: 14 },
];

export const mockPlayers: PlayerAdminView[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  discordUserId: `${100000000000000000n + BigInt(i)}`,
  username: ['xXBrainrotKingXx', 'PatapimFan42', 'CrocoLover', 'BallerinaMaster', 'MythicHunter', 'GorgonzillaSlayer', 'TralaGamer', 'TungTungPro', 'BombardinoChief', 'CappuccinoNinja', 'RollAddict', 'WishMaster', 'CollectorPrime', 'RarityChaser', 'SlugMaster', 'BrainrotLord', 'MemeCatcher', 'EpicRoller', 'LegendHunter', 'CommonKing', 'RareSeeker', 'MythicDreamer', 'FavoriteFan', 'InventoryGod', 'LeaderTop'][i],
  globalName: i % 3 === 0 ? `Player ${i + 1}` : null,
  lastRollAt: randomDate(3),
  lastClaimAt: randomDate(5),
  createdAt: randomDate(60),
  updatedAt: randomDate(1),
  guildCount: Math.floor(Math.random() * 3) + 1,
  inventoryCount: Math.floor(Math.random() * 50) + 1,
  wishCount: Math.floor(Math.random() * 10),
  favoriteCount: Math.floor(Math.random() * 8),
  score: Math.floor(Math.random() * 2000) + 10,
}));

export const mockGuilds: GuildRecord[] = [
  { id: 1, discordGuildId: '1234567890123456789', configuredChannelId: '9876543210987654321', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-03-15T00:00:00Z' },
  { id: 2, discordGuildId: '1111111111111111111', configuredChannelId: null, createdAt: '2025-02-10T00:00:00Z', updatedAt: '2025-02-10T00:00:00Z' },
  { id: 3, discordGuildId: '2222222222222222222', configuredChannelId: '3333333333333333333', createdAt: '2025-03-01T00:00:00Z', updatedAt: '2025-04-01T00:00:00Z' },
];

export const mockRolls: ActiveRollRecord[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  guildId: (i % 3) + 1,
  channelId: `chan-${i}`,
  messageId: i % 5 !== 0 ? `msg-${i}` : null,
  brainrotId: (i % mockBrainrots.length) + 1,
  rolledByPlayerId: (i % 10) + 1,
  status: (['active', 'claimed', 'expired'] as const)[i % 3],
  createdAt: randomDate(30),
  expiresAt: randomDate(1),
  claimedByPlayerId: i % 3 === 1 ? (i % 10) + 2 : null,
  claimedAt: i % 3 === 1 ? randomDate(1) : null,
  updatedAt: randomDate(1),
  brainrotName: mockBrainrots[i % mockBrainrots.length].name,
  brainrotSlug: mockBrainrots[i % mockBrainrots.length].slug,
  brainrotRarity: mockBrainrots[i % mockBrainrots.length].rarity,
  rolledByUsername: mockPlayers[i % 10].username,
  claimedByUsername: i % 3 === 1 ? mockPlayers[(i % 10) + 1]?.username : undefined,
}));

export const mockDashboardKPIs: DashboardKPIs = {
  totalPlayers: 247,
  totalGuilds: 3,
  totalBrainrots: 86,
  totalRolls: 1842,
  activeRolls: 4,
  claimedRolls: 1520,
  totalInventoryEntries: 3200,
  totalWishes: 580,
  totalFavorites: 310,
};

export const mockRuntimeStatus: RuntimeStatus = {
  status: 'running',
  pid: 28451,
  uptime: 86400 * 3 + 7200 + 1800,
  lastStartedAt: new Date(Date.now() - (86400 * 3 + 7200 + 1800) * 1000).toISOString(),
  memoryUsageMb: 142.5,
};

export const mockDataHealth: DataHealthCheck = {
  tableCounts: {
    players: 247,
    guilds: 3,
    brainrots: 86,
    player_brainrots: 3200,
    active_rolls: 1842,
    player_guilds: 310,
    player_wishes: 580,
    player_favorites: 310,
    schema_migrations: 3,
  },
  migrationsApplied: ['0001_initial', '0002_player_wishes_and_favorites', '0003_allow_multiple_active_rolls_per_channel'],
  orphanedRecords: 0,
  inconsistencies: [],
};

export const mockMaintenanceTasks: MaintenanceTask[] = [
  { id: '1', name: 'db:seed', status: 'completed', startedAt: randomDate(2), completedAt: randomDate(1), logs: ['Parsing seed file...', '86 brainrots found.', 'Sync complete. 0 inserted, 0 updated.'], triggeredBy: 'admin' },
  { id: '2', name: 'assets:sync', status: 'completed', startedAt: randomDate(5), completedAt: randomDate(5), logs: ['Checking 86 assets...', 'All assets present.', 'Done.'], triggeredBy: 'admin' },
  { id: '3', name: 'catalog:generate', status: 'failed', startedAt: randomDate(7), completedAt: randomDate(7), logs: ['Generating catalog...', 'ERROR: Output directory not found.'], triggeredBy: 'admin' },
];

export const mockPlayerStats: PlayerProfileStats = {
  totalBrainrots: 34,
  uniqueBrainrots: 22,
  rarityScore: 186,
  score: 440,
  wishCount: 5,
  favoriteCount: 3,
  highestOwnedRarity: 'legendary',
};

export const mockPlayerInventory: InventoryEntry[] = mockBrainrots.slice(0, 5).map((b, i) => ({
  brainrot: b,
  quantity: Math.floor(Math.random() * 5) + 1,
  isFavorite: i < 2,
  firstObtainedAt: randomDate(30),
  lastObtainedAt: randomDate(5),
}));

export const mockLeaderboard: LeaderboardEntry[] = mockPlayers.slice(0, 10).map((p, i) => ({
  playerId: p.id,
  discordUserId: p.discordUserId,
  username: p.username,
  globalName: p.globalName,
  totalBrainrots: 50 - i * 4,
  uniqueBrainrots: 30 - i * 2,
  rarityScore: 500 - i * 40,
  score: 1000 - i * 80,
}));
