import type Database from 'better-sqlite3';

import { getScoreFromInventory } from '../../config/game.js';
import type {
  BrainrotRecord,
  InventoryEntry,
  InventorySort,
  PlayerProfileStats,
  Rarity,
  SourceStatus
} from '../../core/types.js';

interface InventoryRow {
  quantity: number;
  is_favorite: number;
  first_obtained_at: string;
  last_obtained_at: string;
  brainrot_id: number;
  external_id: string;
  name: string;
  slug: string;
  rarity: Rarity;
  image_url: string;
  description: string;
  source_status: SourceStatus;
  aliases_json: string;
  created_at: string;
  updated_at: string;
}

interface ProfileAggregateRow {
  total_brainrots: number;
  unique_brainrots: number;
  rarity_score: number;
  highest_rarity_rank: number | null;
}

const rarityRankSql = `
  CASE b.rarity
    WHEN 'common' THEN 1
    WHEN 'rare' THEN 2
    WHEN 'epic' THEN 3
    WHEN 'legendary' THEN 4
    WHEN 'mythic' THEN 5
  END
`;

const rarityScoreSql = `
  CASE b.rarity
    WHEN 'common' THEN 1
    WHEN 'rare' THEN 3
    WHEN 'epic' THEN 10
    WHEN 'legendary' THEN 25
    WHEN 'mythic' THEN 60
  END
`;

function mapBrainrotRow(row: InventoryRow): BrainrotRecord {
  return {
    databaseId: row.brainrot_id,
    id: row.external_id,
    name: row.name,
    slug: row.slug,
    rarity: row.rarity,
    imageUrl: row.image_url,
    description: row.description,
    sourceStatus: row.source_status,
    aliases: JSON.parse(row.aliases_json) as string[],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapInventoryRow(row: InventoryRow): InventoryEntry {
  return {
    brainrot: mapBrainrotRow(row),
    quantity: row.quantity,
    isFavorite: row.is_favorite === 1,
    firstObtainedAt: row.first_obtained_at,
    lastObtainedAt: row.last_obtained_at
  };
}

function rankToRarity(rank: number | null): Rarity | null {
  switch (rank) {
    case 1:
      return 'common';
    case 2:
      return 'rare';
    case 3:
      return 'epic';
    case 4:
      return 'legendary';
    case 5:
      return 'mythic';
    default:
      return null;
  }
}

function getInventoryOrderClause(sort: InventorySort): string {
  switch (sort) {
    case 'quantity':
      return 'pb.quantity DESC, pb.last_obtained_at DESC, b.name ASC';
    case 'recent':
      return 'pb.last_obtained_at DESC, pb.quantity DESC, b.name ASC';
    case 'alphabetical':
      return 'b.name ASC';
    case 'rarity':
    default:
      return `${rarityRankSql} DESC, pb.quantity DESC, b.name ASC`;
  }
}

export class PlayerBrainrotRepository {
  public constructor(private readonly database: Database.Database) {}

  public incrementOwnership(playerId: number, brainrotId: number, timestamp: string): void {
    this.database
      .prepare(`
        INSERT INTO player_brainrots (
          player_id,
          brainrot_id,
          quantity,
          first_obtained_at,
          last_obtained_at,
          created_at,
          updated_at
        )
        VALUES (?, ?, 1, ?, ?, ?, ?)
        ON CONFLICT(player_id, brainrot_id) DO UPDATE SET
          quantity = player_brainrots.quantity + 1,
          last_obtained_at = excluded.last_obtained_at,
          updated_at = excluded.updated_at
      `)
      .run(playerId, brainrotId, timestamp, timestamp, timestamp, timestamp);
  }

  public getProfileStats(playerId: number): PlayerProfileStats {
    const row = this.database
      .prepare(`
        SELECT
          COALESCE(SUM(pb.quantity), 0) as total_brainrots,
          COUNT(pb.brainrot_id) as unique_brainrots,
          COALESCE(SUM((${rarityScoreSql}) * pb.quantity), 0) as rarity_score,
          MAX(${rarityRankSql}) as highest_rarity_rank
        FROM player_brainrots pb
        JOIN brainrots b ON b.id = pb.brainrot_id
        WHERE pb.player_id = ?
      `)
      .get(playerId) as ProfileAggregateRow;

    const lastObtained = this.getLastObtainedBrainrot(playerId);
    const score = getScoreFromInventory(row.total_brainrots, row.unique_brainrots, row.rarity_score);

    return {
      totalBrainrots: row.total_brainrots,
      uniqueBrainrots: row.unique_brainrots,
      rarityScore: row.rarity_score,
      score,
      wishCount: 0,
      favoriteCount: 0,
      highestOwnedRarity: rankToRarity(row.highest_rarity_rank),
      lastObtainedBrainrot: lastObtained?.brainrot ?? null,
      lastObtainedAt: lastObtained?.lastObtainedAt ?? null
    };
  }

  public getLastObtainedBrainrot(playerId: number): InventoryEntry | null {
    const row = this.database
      .prepare(`
        SELECT
          pb.quantity,
          CASE WHEN pf.id IS NULL THEN 0 ELSE 1 END as is_favorite,
          pb.first_obtained_at,
          pb.last_obtained_at,
          b.id as brainrot_id,
          b.external_id,
          b.name,
          b.slug,
          b.rarity,
          b.image_url,
          b.description,
          b.source_status,
          b.aliases_json,
          b.created_at,
          b.updated_at
        FROM player_brainrots pb
        JOIN brainrots b ON b.id = pb.brainrot_id
        LEFT JOIN player_favorites pf ON pf.player_id = pb.player_id AND pf.brainrot_id = pb.brainrot_id
        WHERE pb.player_id = ?
        ORDER BY pb.last_obtained_at DESC
        LIMIT 1
      `)
      .get(playerId) as InventoryRow | undefined;

    return row ? mapInventoryRow(row) : null;
  }

  public countOwnedEntries(playerId: number): number {
    return this.countOwnedEntriesWithFilter(playerId, false);
  }

  public countOwnedEntriesWithFilter(playerId: number, favoritesOnly: boolean): number {
    const row = this.database
      .prepare(`
        SELECT COUNT(*) as total
        FROM player_brainrots pb
        WHERE pb.player_id = ?
          AND (? = 0 OR EXISTS (
            SELECT 1
            FROM player_favorites pf
            WHERE pf.player_id = pb.player_id AND pf.brainrot_id = pb.brainrot_id
          ))
      `)
      .get(playerId, favoritesOnly ? 1 : 0) as { total: number };

    return row.total;
  }

  public getInventoryEntries(
    playerId: number,
    sort: InventorySort,
    limit: number,
    offset: number,
    favoritesOnly: boolean
  ): InventoryEntry[] {
    const orderClause = getInventoryOrderClause(sort);
    const rows = this.database
      .prepare(`
        SELECT
          pb.quantity,
          CASE WHEN pf.id IS NULL THEN 0 ELSE 1 END as is_favorite,
          pb.first_obtained_at,
          pb.last_obtained_at,
          b.id as brainrot_id,
          b.external_id,
          b.name,
          b.slug,
          b.rarity,
          b.image_url,
          b.description,
          b.source_status,
          b.aliases_json,
          b.created_at,
          b.updated_at
        FROM player_brainrots pb
        JOIN brainrots b ON b.id = pb.brainrot_id
        LEFT JOIN player_favorites pf ON pf.player_id = pb.player_id AND pf.brainrot_id = pb.brainrot_id
        WHERE pb.player_id = ?
          AND (? = 0 OR pf.id IS NOT NULL)
        ORDER BY ${orderClause}
        LIMIT ? OFFSET ?
      `)
      .all(playerId, favoritesOnly ? 1 : 0, limit, offset) as InventoryRow[];

    return rows.map(mapInventoryRow);
  }

  public ownsBrainrot(playerId: number, brainrotId: number): boolean {
    const row = this.database
      .prepare('SELECT 1 as present FROM player_brainrots WHERE player_id = ? AND brainrot_id = ?')
      .get(playerId, brainrotId) as { present: number } | undefined;

    return row?.present === 1;
  }

  public getOwnedQuantity(playerId: number, brainrotId: number): number {
    const row = this.database
      .prepare('SELECT quantity FROM player_brainrots WHERE player_id = ? AND brainrot_id = ?')
      .get(playerId, brainrotId) as { quantity: number } | undefined;

    return row?.quantity ?? 0;
  }
}
