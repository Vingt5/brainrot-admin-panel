import type Database from 'better-sqlite3';

import type { BrainrotRecord, PlayerRecord, Rarity, SourceStatus } from '../../core/types.js';

interface WishBrainrotRow {
  id: number;
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

interface WishPlayerRow {
  discord_user_id: string;
}

function mapBrainrotRow(row: WishBrainrotRow): BrainrotRecord {
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
    updatedAt: row.updated_at
  };
}

export class PlayerWishRepository {
  public constructor(private readonly database: Database.Database) {}

  public addWish(playerId: number, brainrotId: number, timestamp: string): boolean {
    const result = this.database
      .prepare(`
        INSERT OR IGNORE INTO player_wishes (
          player_id,
          brainrot_id,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?)
      `)
      .run(playerId, brainrotId, timestamp, timestamp);

    return result.changes > 0;
  }

  public removeWish(playerId: number, brainrotId: number): boolean {
    const result = this.database
      .prepare('DELETE FROM player_wishes WHERE player_id = ? AND brainrot_id = ?')
      .run(playerId, brainrotId);

    return result.changes > 0;
  }

  public countForPlayer(playerId: number): number {
    const row = this.database
      .prepare('SELECT COUNT(*) as total FROM player_wishes WHERE player_id = ?')
      .get(playerId) as { total: number };

    return row.total;
  }

  public hasWish(playerId: number, brainrotId: number): boolean {
    const row = this.database
      .prepare('SELECT 1 as present FROM player_wishes WHERE player_id = ? AND brainrot_id = ?')
      .get(playerId, brainrotId) as { present: number } | undefined;

    return row?.present === 1;
  }

  public getWishEntries(playerId: number): BrainrotRecord[] {
    const rows = this.database
      .prepare(`
        SELECT
          b.*
        FROM player_wishes pw
        JOIN brainrots b ON b.id = pw.brainrot_id
        WHERE pw.player_id = ?
        ORDER BY
          CASE b.rarity
            WHEN 'mythic' THEN 5
            WHEN 'legendary' THEN 4
            WHEN 'epic' THEN 3
            WHEN 'rare' THEN 2
            WHEN 'common' THEN 1
          END DESC,
          b.name ASC
      `)
      .all(playerId) as WishBrainrotRow[];

    return rows.map(mapBrainrotRow);
  }

  public getWishersForGuildAndBrainrot(guildId: number, brainrotId: number): PlayerRecord[] {
    const rows = this.database
      .prepare(`
        SELECT DISTINCT
          p.id,
          p.discord_user_id,
          p.username,
          p.global_name,
          p.last_roll_at,
          p.last_claim_at,
          p.created_at,
          p.updated_at
        FROM player_wishes pw
        JOIN players p ON p.id = pw.player_id
        JOIN player_guilds pg ON pg.player_id = p.id
        WHERE pg.guild_id = ? AND pw.brainrot_id = ?
        ORDER BY COALESCE(p.global_name, p.username) ASC, p.discord_user_id ASC
      `)
      .all(guildId, brainrotId) as Array<{
        id: number;
        discord_user_id: string;
        username: string;
        global_name: string | null;
        last_roll_at: string | null;
        last_claim_at: string | null;
        created_at: string;
        updated_at: string;
      }>;

    return rows.map((row) => ({
      id: row.id,
      discordUserId: row.discord_user_id,
      username: row.username,
      globalName: row.global_name,
      lastRollAt: row.last_roll_at,
      lastClaimAt: row.last_claim_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }
}
