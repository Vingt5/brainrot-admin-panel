import type Database from 'better-sqlite3';

import type { DiscordUserSnapshot, PlayerRecord } from '../../core/types.js';

interface PlayerRow {
  id: number;
  discord_user_id: string;
  username: string;
  global_name: string | null;
  last_roll_at: string | null;
  last_claim_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapPlayerRow(row: PlayerRow): PlayerRecord {
  return {
    id: row.id,
    discordUserId: row.discord_user_id,
    username: row.username,
    globalName: row.global_name,
    lastRollAt: row.last_roll_at,
    lastClaimAt: row.last_claim_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class PlayerRepository {
  public constructor(private readonly database: Database.Database) {}

  public upsertDiscordUser(user: DiscordUserSnapshot, timestamp: string): PlayerRecord {
    this.database
      .prepare(`
        INSERT INTO players (
          discord_user_id,
          username,
          global_name,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(discord_user_id) DO UPDATE SET
          username = excluded.username,
          global_name = excluded.global_name,
          updated_at = excluded.updated_at
      `)
      .run(user.discordUserId, user.username, user.globalName, timestamp, timestamp);

    const player = this.findByDiscordUserId(user.discordUserId);

    if (!player) {
      throw new Error(`Impossible de créer ou mettre à jour le joueur ${user.discordUserId}.`);
    }

    return player;
  }

  public findByDiscordUserId(discordUserId: string): PlayerRecord | null {
    const row = this.database
      .prepare('SELECT * FROM players WHERE discord_user_id = ?')
      .get(discordUserId) as PlayerRow | undefined;

    return row ? mapPlayerRow(row) : null;
  }

  public findById(id: number): PlayerRecord | null {
    const row = this.database
      .prepare('SELECT * FROM players WHERE id = ?')
      .get(id) as PlayerRow | undefined;

    return row ? mapPlayerRow(row) : null;
  }

  public updateLastRollAt(playerId: number, timestamp: string): void {
    this.database
      .prepare('UPDATE players SET last_roll_at = ?, updated_at = ? WHERE id = ?')
      .run(timestamp, timestamp, playerId);
  }

  public updateLastClaimAt(playerId: number, timestamp: string): void {
    this.database
      .prepare('UPDATE players SET last_claim_at = ?, updated_at = ? WHERE id = ?')
      .run(timestamp, timestamp, playerId);
  }
}
