import { LEADERBOARD_LIMIT, getScoreFromInventory } from '../src/config/game.js';
import type { AppContext } from '../src/core/appContext.js';
import type { GuildRecord, InventoryEntry, PlayerProfileStats } from '../src/core/types.js';
import type {
  ActiveRollAdminView,
  BrainrotAdminView,
  DashboardKPIs,
  DataHealthCheck,
  PaginationResult,
  PlayerAdminView
} from './contracts.js';

const DEFAULT_PAGE_SIZE = 25;

const rarityScoreSql = `
  CASE b.rarity
    WHEN 'common' THEN 1
    WHEN 'rare' THEN 3
    WHEN 'epic' THEN 10
    WHEN 'legendary' THEN 25
    WHEN 'mythic' THEN 60
  END
`;

const raritySortSql = `
  CASE b.rarity
    WHEN 'mythic' THEN 5
    WHEN 'legendary' THEN 4
    WHEN 'epic' THEN 3
    WHEN 'rare' THEN 2
    WHEN 'common' THEN 1
  END
`;

interface PlayerListRow {
  id: number;
  discord_user_id: string;
  username: string;
  global_name: string | null;
  last_roll_at: string | null;
  last_claim_at: string | null;
  created_at: string;
  updated_at: string;
  guild_count: number;
  inventory_count: number;
  unique_brainrots: number;
  rarity_score: number;
  wish_count: number;
  favorite_count: number;
}

interface BrainrotAdminRow {
  id: number;
  external_id: string;
  name: string;
  slug: string;
  rarity: BrainrotAdminView['rarity'];
  image_url: string;
  description: string;
  source_status: BrainrotAdminView['sourceStatus'];
  aliases_json: string;
  created_at: string;
  updated_at: string;
  owner_count: number;
  total_owned: number;
  wish_count: number;
  favorite_count: number;
}

interface RollAdminRow {
  id: number;
  guild_id: number;
  channel_id: string;
  message_id: string | null;
  brainrot_id: number;
  rolled_by_player_id: number;
  status: ActiveRollAdminView['status'];
  created_at: string;
  expires_at: string;
  claimed_by_player_id: number | null;
  claimed_at: string | null;
  updated_at: string;
  brainrot_name: string;
  brainrot_slug: string;
  brainrot_rarity: ActiveRollAdminView['brainrotRarity'];
  rolled_by_username: string;
  claimed_by_username: string | null;
}

function normalizePage(page: number | undefined): number {
  if (!page || Number.isNaN(page) || page < 1) {
    return 1;
  }

  return Math.floor(page);
}

function mapPlayerRow(row: PlayerListRow): PlayerAdminView {
  return {
    id: row.id,
    discordUserId: row.discord_user_id,
    username: row.username,
    globalName: row.global_name,
    lastRollAt: row.last_roll_at,
    lastClaimAt: row.last_claim_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    guildCount: row.guild_count,
    inventoryCount: row.inventory_count,
    wishCount: row.wish_count,
    favoriteCount: row.favorite_count,
    score: getScoreFromInventory(row.inventory_count, row.unique_brainrots, row.rarity_score)
  };
}

function mapBrainrotRow(row: BrainrotAdminRow): BrainrotAdminView {
  return {
    databaseId: row.id,
    id: row.external_id,
    name: row.name,
    slug: row.slug,
    rarity: row.rarity,
    imageUrl: row.image_url,
    description: row.description,
    sourceStatus: row.source_status,
    aliases: JSON.parse(row.aliases_json) as string[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ownerCount: row.owner_count,
    totalOwned: row.total_owned,
    wishCount: row.wish_count,
    favoriteCount: row.favorite_count
  };
}

function mapRollRow(row: RollAdminRow): ActiveRollAdminView {
  return {
    id: row.id,
    guildId: row.guild_id,
    channelId: row.channel_id,
    messageId: row.message_id,
    brainrotId: row.brainrot_id,
    rolledByPlayerId: row.rolled_by_player_id,
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    claimedByPlayerId: row.claimed_by_player_id,
    claimedAt: row.claimed_at,
    updatedAt: row.updated_at,
    brainrotName: row.brainrot_name,
    brainrotSlug: row.brainrot_slug,
    brainrotRarity: row.brainrot_rarity,
    rolledByUsername: row.rolled_by_username,
    claimedByUsername: row.claimed_by_username ?? undefined
  };
}

export class AdminDataService {
  public constructor(private readonly context: AppContext) {}

  public getDashboardKPIs(): DashboardKPIs {
    const row = this.context.database
      .prepare(`
        SELECT
          (SELECT COUNT(*) FROM players) as total_players,
          (SELECT COUNT(*) FROM guilds) as total_guilds,
          (SELECT COUNT(*) FROM brainrots) as total_brainrots,
          (SELECT COUNT(*) FROM active_rolls) as total_rolls,
          (SELECT COUNT(*) FROM active_rolls WHERE status = 'active') as active_rolls,
          (SELECT COUNT(*) FROM active_rolls WHERE status = 'claimed') as claimed_rolls,
          (SELECT COALESCE(SUM(quantity), 0) FROM player_brainrots) as total_inventory_entries,
          (SELECT COUNT(*) FROM player_wishes) as total_wishes,
          (SELECT COUNT(*) FROM player_favorites) as total_favorites
      `)
      .get() as {
      total_players: number;
      total_guilds: number;
      total_brainrots: number;
      total_rolls: number;
      active_rolls: number;
      claimed_rolls: number;
      total_inventory_entries: number;
      total_wishes: number;
      total_favorites: number;
    };

    return {
      totalPlayers: row.total_players,
      totalGuilds: row.total_guilds,
      totalBrainrots: row.total_brainrots,
      totalRolls: row.total_rolls,
      activeRolls: row.active_rolls,
      claimedRolls: row.claimed_rolls,
      totalInventoryEntries: row.total_inventory_entries,
      totalWishes: row.total_wishes,
      totalFavorites: row.total_favorites
    };
  }

  public getDataHealth(): DataHealthCheck {
    const tableNames = [
      'players',
      'guilds',
      'player_guilds',
      'brainrots',
      'player_brainrots',
      'player_wishes',
      'player_favorites',
      'active_rolls',
      'schema_migrations'
    ];

    const tableCounts = Object.fromEntries(
      tableNames.map((table) => {
        const row = this.context.database.prepare(`SELECT COUNT(*) as total FROM ${table}`).get() as {
          total: number;
        };
        return [table, row.total];
      })
    );

    const migrationsApplied = (
      this.context.database
        .prepare('SELECT name FROM schema_migrations ORDER BY name ASC')
        .all() as Array<{ name: string }>
    ).map((row) => row.name);

    const favoritesWithoutOwnership = (
      this.context.database
        .prepare(`
          SELECT COUNT(*) as total
          FROM player_favorites pf
          LEFT JOIN player_brainrots pb
            ON pb.player_id = pf.player_id
           AND pb.brainrot_id = pf.brainrot_id
          WHERE pb.id IS NULL
        `)
        .get() as { total: number }
    ).total;

    const claimedRollsWithoutClaimData = (
      this.context.database
        .prepare(`
          SELECT COUNT(*) as total
          FROM active_rolls
          WHERE status = 'claimed'
            AND (claimed_by_player_id IS NULL OR claimed_at IS NULL)
        `)
        .get() as { total: number }
    ).total;

    const activeRollsWithClaimData = (
      this.context.database
        .prepare(`
          SELECT COUNT(*) as total
          FROM active_rolls
          WHERE status = 'active'
            AND (claimed_by_player_id IS NOT NULL OR claimed_at IS NOT NULL)
        `)
        .get() as { total: number }
    ).total;

    const legacyExpiredRolls = (
      this.context.database
        .prepare(`SELECT COUNT(*) as total FROM active_rolls WHERE status = 'expired'`)
        .get() as { total: number }
    ).total;

    const inconsistencies: string[] = [];

    if (favoritesWithoutOwnership > 0) {
      inconsistencies.push(`${favoritesWithoutOwnership} favorite(s) sans possession correspondante.`);
    }

    if (claimedRollsWithoutClaimData > 0) {
      inconsistencies.push(`${claimedRollsWithoutClaimData} roll(s) claimed sans claimant complet.`);
    }

    if (activeRollsWithClaimData > 0) {
      inconsistencies.push(`${activeRollsWithClaimData} roll(s) actifs contiennent encore des donnees de claim.`);
    }

    if (legacyExpiredRolls > 0) {
      inconsistencies.push(`${legacyExpiredRolls} roll(s) en statut expired legacy detectes.`);
    }

    return {
      tableCounts,
      migrationsApplied,
      orphanedRecords: favoritesWithoutOwnership,
      inconsistencies
    };
  }

  public getPlayers(params: { page?: number; search?: string }): PaginationResult<PlayerAdminView> {
    const page = normalizePage(params.page);
    const offset = (page - 1) * DEFAULT_PAGE_SIZE;
    const hasSearch = Boolean(params.search?.trim());
    const search = `%${params.search?.trim() ?? ''}%`;

    const total = (
      this.context.database
        .prepare(`
          SELECT COUNT(*) as total
          FROM players p
          WHERE (
            ? = 0
            OR p.username LIKE ?
            OR COALESCE(p.global_name, '') LIKE ?
            OR p.discord_user_id LIKE ?
          )
        `)
        .get(hasSearch ? 1 : 0, search, search, search) as { total: number }
    ).total;

    const rows = this.context.database
      .prepare(`
        SELECT
          p.*,
          COALESCE(pg.guild_count, 0) as guild_count,
          COALESCE(pb.inventory_count, 0) as inventory_count,
          COALESCE(pb.unique_brainrots, 0) as unique_brainrots,
          COALESCE(pb.rarity_score, 0) as rarity_score,
          COALESCE(pw.wish_count, 0) as wish_count,
          COALESCE(pf.favorite_count, 0) as favorite_count
        FROM players p
        LEFT JOIN (
          SELECT player_id, COUNT(*) as guild_count
          FROM player_guilds
          GROUP BY player_id
        ) pg ON pg.player_id = p.id
        LEFT JOIN (
          SELECT
            pb.player_id,
            COALESCE(SUM(pb.quantity), 0) as inventory_count,
            COUNT(pb.brainrot_id) as unique_brainrots,
            COALESCE(SUM((${rarityScoreSql}) * pb.quantity), 0) as rarity_score
          FROM player_brainrots pb
          JOIN brainrots b ON b.id = pb.brainrot_id
          GROUP BY pb.player_id
        ) pb ON pb.player_id = p.id
        LEFT JOIN (
          SELECT player_id, COUNT(*) as wish_count
          FROM player_wishes
          GROUP BY player_id
        ) pw ON pw.player_id = p.id
        LEFT JOIN (
          SELECT player_id, COUNT(*) as favorite_count
          FROM player_favorites
          GROUP BY player_id
        ) pf ON pf.player_id = p.id
        WHERE (
          ? = 0
          OR p.username LIKE ?
          OR COALESCE(p.global_name, '') LIKE ?
          OR p.discord_user_id LIKE ?
        )
        ORDER BY
          (COALESCE(pb.rarity_score, 0) + COALESCE(pb.unique_brainrots, 0) * 10 + COALESCE(pb.inventory_count, 0)) DESC,
          p.username ASC
        LIMIT ? OFFSET ?
      `)
      .all(hasSearch ? 1 : 0, search, search, search, DEFAULT_PAGE_SIZE, offset) as PlayerListRow[];

    return {
      data: rows.map(mapPlayerRow),
      total,
      page,
      pageSize: DEFAULT_PAGE_SIZE
    };
  }

  public getPlayerById(playerId: number): PlayerAdminView | null {
    const row = this.context.database
      .prepare(`
        SELECT
          p.*,
          COALESCE(pg.guild_count, 0) as guild_count,
          COALESCE(pb.inventory_count, 0) as inventory_count,
          COALESCE(pb.unique_brainrots, 0) as unique_brainrots,
          COALESCE(pb.rarity_score, 0) as rarity_score,
          COALESCE(pw.wish_count, 0) as wish_count,
          COALESCE(pf.favorite_count, 0) as favorite_count
        FROM players p
        LEFT JOIN (
          SELECT player_id, COUNT(*) as guild_count
          FROM player_guilds
          GROUP BY player_id
        ) pg ON pg.player_id = p.id
        LEFT JOIN (
          SELECT
            pb.player_id,
            COALESCE(SUM(pb.quantity), 0) as inventory_count,
            COUNT(pb.brainrot_id) as unique_brainrots,
            COALESCE(SUM((${rarityScoreSql}) * pb.quantity), 0) as rarity_score
          FROM player_brainrots pb
          JOIN brainrots b ON b.id = pb.brainrot_id
          GROUP BY pb.player_id
        ) pb ON pb.player_id = p.id
        LEFT JOIN (
          SELECT player_id, COUNT(*) as wish_count
          FROM player_wishes
          GROUP BY player_id
        ) pw ON pw.player_id = p.id
        LEFT JOIN (
          SELECT player_id, COUNT(*) as favorite_count
          FROM player_favorites
          GROUP BY player_id
        ) pf ON pf.player_id = p.id
        WHERE p.id = ?
      `)
      .get(playerId) as PlayerListRow | undefined;

    return row ? mapPlayerRow(row) : null;
  }

  public getPlayerStats(playerId: number): PlayerProfileStats | null {
    const player = this.context.repositories.playerRepository.findById(playerId);

    if (!player) {
      return null;
    }

    const stats = this.context.repositories.playerBrainrotRepository.getProfileStats(playerId);
    return {
      ...stats,
      wishCount: this.context.repositories.playerWishRepository.countForPlayer(playerId),
      favoriteCount: this.context.repositories.playerFavoriteRepository.countForPlayer(playerId)
    };
  }

  public getPlayerInventory(playerId: number): InventoryEntry[] | null {
    const player = this.context.repositories.playerRepository.findById(playerId);

    if (!player) {
      return null;
    }

    return this.context.repositories.playerBrainrotRepository.getInventoryEntries(
      playerId,
      'rarity',
      500,
      0,
      false
    );
  }

  public getBrainrots(params: {
    page?: number;
    search?: string;
    rarity?: string;
  }): PaginationResult<BrainrotAdminView> {
    const page = normalizePage(params.page);
    const offset = (page - 1) * DEFAULT_PAGE_SIZE;
    const hasSearch = Boolean(params.search?.trim());
    const search = `%${params.search?.trim() ?? ''}%`;
    const hasRarity = Boolean(params.rarity?.trim());

    const total = (
      this.context.database
        .prepare(`
          SELECT COUNT(*) as total
          FROM brainrots b
          WHERE (
            ? = 0
            OR b.name LIKE ?
            OR b.slug LIKE ?
            OR b.external_id LIKE ?
            OR b.aliases_json LIKE ?
          )
            AND (? = 0 OR b.rarity = ?)
        `)
        .get(
          hasSearch ? 1 : 0,
          search,
          search,
          search,
          search,
          hasRarity ? 1 : 0,
          params.rarity ?? null
        ) as { total: number }
    ).total;

    const rows = this.context.database
      .prepare(`
        SELECT
          b.*,
          COALESCE(pb.owner_count, 0) as owner_count,
          COALESCE(pb.total_owned, 0) as total_owned,
          COALESCE(pw.wish_count, 0) as wish_count,
          COALESCE(pf.favorite_count, 0) as favorite_count
        FROM brainrots b
        LEFT JOIN (
          SELECT
            brainrot_id,
            COUNT(player_id) as owner_count,
            COALESCE(SUM(quantity), 0) as total_owned
          FROM player_brainrots
          GROUP BY brainrot_id
        ) pb ON pb.brainrot_id = b.id
        LEFT JOIN (
          SELECT brainrot_id, COUNT(*) as wish_count
          FROM player_wishes
          GROUP BY brainrot_id
        ) pw ON pw.brainrot_id = b.id
        LEFT JOIN (
          SELECT brainrot_id, COUNT(*) as favorite_count
          FROM player_favorites
          GROUP BY brainrot_id
        ) pf ON pf.brainrot_id = b.id
        WHERE (
          ? = 0
          OR b.name LIKE ?
          OR b.slug LIKE ?
          OR b.external_id LIKE ?
          OR b.aliases_json LIKE ?
        )
          AND (? = 0 OR b.rarity = ?)
        ORDER BY
          ${raritySortSql} DESC,
          COALESCE(pb.owner_count, 0) DESC,
          b.name ASC
        LIMIT ? OFFSET ?
      `)
      .all(
        hasSearch ? 1 : 0,
        search,
        search,
        search,
        search,
        hasRarity ? 1 : 0,
        params.rarity ?? null,
        DEFAULT_PAGE_SIZE,
        offset
      ) as BrainrotAdminRow[];

    return {
      data: rows.map(mapBrainrotRow),
      total,
      page,
      pageSize: DEFAULT_PAGE_SIZE
    };
  }

  public getBrainrotById(brainrotId: number): BrainrotAdminView | null {
    const row = this.context.database
      .prepare(`
        SELECT
          b.*,
          COALESCE(pb.owner_count, 0) as owner_count,
          COALESCE(pb.total_owned, 0) as total_owned,
          COALESCE(pw.wish_count, 0) as wish_count,
          COALESCE(pf.favorite_count, 0) as favorite_count
        FROM brainrots b
        LEFT JOIN (
          SELECT
            brainrot_id,
            COUNT(player_id) as owner_count,
            COALESCE(SUM(quantity), 0) as total_owned
          FROM player_brainrots
          GROUP BY brainrot_id
        ) pb ON pb.brainrot_id = b.id
        LEFT JOIN (
          SELECT brainrot_id, COUNT(*) as wish_count
          FROM player_wishes
          GROUP BY brainrot_id
        ) pw ON pw.brainrot_id = b.id
        LEFT JOIN (
          SELECT brainrot_id, COUNT(*) as favorite_count
          FROM player_favorites
          GROUP BY brainrot_id
        ) pf ON pf.brainrot_id = b.id
        WHERE b.id = ?
      `)
      .get(brainrotId) as BrainrotAdminRow | undefined;

    return row ? mapBrainrotRow(row) : null;
  }

  public getGuilds(): GuildRecord[] {
    const rows = this.context.database
      .prepare(`
        SELECT
          id,
          discord_guild_id,
          configured_channel_id,
          created_at,
          updated_at
        FROM guilds
        ORDER BY created_at DESC
      `)
      .all() as Array<{
      id: number;
      discord_guild_id: string;
      configured_channel_id: string | null;
      created_at: string;
      updated_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      discordGuildId: row.discord_guild_id,
      configuredChannelId: row.configured_channel_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  public getRolls(params: { page?: number; status?: string }): PaginationResult<ActiveRollAdminView> {
    const page = normalizePage(params.page);
    const offset = (page - 1) * DEFAULT_PAGE_SIZE;
    const hasStatus = Boolean(params.status?.trim());

    const total = (
      this.context.database
        .prepare(`
          SELECT COUNT(*) as total
          FROM active_rolls
          WHERE (? = 0 OR status = ?)
        `)
        .get(hasStatus ? 1 : 0, params.status ?? null) as { total: number }
    ).total;

    const rows = this.context.database
      .prepare(`
        SELECT
          ar.*,
          b.name as brainrot_name,
          b.slug as brainrot_slug,
          b.rarity as brainrot_rarity,
          rp.username as rolled_by_username,
          cp.username as claimed_by_username
        FROM active_rolls ar
        JOIN brainrots b ON b.id = ar.brainrot_id
        JOIN players rp ON rp.id = ar.rolled_by_player_id
        LEFT JOIN players cp ON cp.id = ar.claimed_by_player_id
        WHERE (? = 0 OR ar.status = ?)
        ORDER BY ar.created_at DESC
        LIMIT ? OFFSET ?
      `)
      .all(hasStatus ? 1 : 0, params.status ?? null, DEFAULT_PAGE_SIZE, offset) as RollAdminRow[];

    return {
      data: rows.map(mapRollRow),
      total,
      page,
      pageSize: DEFAULT_PAGE_SIZE
    };
  }

  public getLeaderboard(guildId: number) {
    return this.context.repositories.leaderboardRepository.getTopForGuild(guildId, LEADERBOARD_LIMIT);
  }
}
