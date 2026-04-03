import type Database from 'better-sqlite3';

import type { GuildRecord } from '../../core/types.js';

interface GuildRow {
  id: number;
  discord_guild_id: string;
  configured_channel_id: string | null;
  created_at: string;
  updated_at: string;
}

function mapGuildRow(row: GuildRow): GuildRecord {
  return {
    id: row.id,
    discordGuildId: row.discord_guild_id,
    configuredChannelId: row.configured_channel_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class GuildRepository {
  public constructor(private readonly database: Database.Database) {}

  public ensureGuild(discordGuildId: string, timestamp: string): GuildRecord {
    this.database
      .prepare(`
        INSERT OR IGNORE INTO guilds (
          discord_guild_id,
          configured_channel_id,
          created_at,
          updated_at
        )
        VALUES (?, NULL, ?, ?)
      `)
      .run(discordGuildId, timestamp, timestamp);

    const guild = this.findByDiscordGuildId(discordGuildId);

    if (!guild) {
      throw new Error(`Impossible d’assurer l’existence du serveur ${discordGuildId}.`);
    }

    return guild;
  }

  public configureChannel(discordGuildId: string, channelId: string, timestamp: string): GuildRecord {
    this.database
      .prepare(`
        INSERT INTO guilds (
          discord_guild_id,
          configured_channel_id,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?)
        ON CONFLICT(discord_guild_id) DO UPDATE SET
          configured_channel_id = excluded.configured_channel_id,
          updated_at = excluded.updated_at
      `)
      .run(discordGuildId, channelId, timestamp, timestamp);

    const guild = this.findByDiscordGuildId(discordGuildId);

    if (!guild) {
      throw new Error(`Impossible de configurer le serveur ${discordGuildId}.`);
    }

    return guild;
  }

  public clearConfiguredChannel(discordGuildId: string, timestamp: string): GuildRecord {
    this.database
      .prepare(`
        INSERT INTO guilds (
          discord_guild_id,
          configured_channel_id,
          created_at,
          updated_at
        )
        VALUES (?, NULL, ?, ?)
        ON CONFLICT(discord_guild_id) DO UPDATE SET
          configured_channel_id = NULL,
          updated_at = excluded.updated_at
      `)
      .run(discordGuildId, timestamp, timestamp);

    const guild = this.findByDiscordGuildId(discordGuildId);

    if (!guild) {
      throw new Error(`Impossible de réinitialiser le serveur ${discordGuildId}.`);
    }

    return guild;
  }

  public findByDiscordGuildId(discordGuildId: string): GuildRecord | null {
    const row = this.database
      .prepare('SELECT * FROM guilds WHERE discord_guild_id = ?')
      .get(discordGuildId) as GuildRow | undefined;

    return row ? mapGuildRow(row) : null;
  }
}
