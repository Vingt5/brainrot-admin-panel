import type Database from 'better-sqlite3';

import type { PlayerGuildRecord } from '../../core/types.js';

interface PlayerGuildRow {
  id: number;
  player_id: number;
  guild_id: number;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

function mapPlayerGuildRow(row: PlayerGuildRow): PlayerGuildRecord {
  return {
    id: row.id,
    playerId: row.player_id,
    guildId: row.guild_id,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class PlayerGuildRepository {
  public constructor(private readonly database: Database.Database) {}

  public upsertMembership(playerId: number, guildId: number, timestamp: string): PlayerGuildRecord {
    this.database
      .prepare(`
        INSERT INTO player_guilds (
          player_id,
          guild_id,
          last_seen_at,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(player_id, guild_id) DO UPDATE SET
          last_seen_at = excluded.last_seen_at,
          updated_at = excluded.updated_at
      `)
      .run(playerId, guildId, timestamp, timestamp, timestamp);

    const row = this.database
      .prepare('SELECT * FROM player_guilds WHERE player_id = ? AND guild_id = ?')
      .get(playerId, guildId) as PlayerGuildRow | undefined;

    if (!row) {
      throw new Error(
        `Impossible de créer ou mettre à jour l’appartenance du joueur ${playerId} au serveur ${guildId}.`
      );
    }

    return mapPlayerGuildRow(row);
  }
}
