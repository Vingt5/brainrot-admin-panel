import type Database from 'better-sqlite3';

import type {
  ActiveRollRecord,
  ActiveRollStatus,
  ActiveRollWithBrainrot,
  Rarity,
  SourceStatus
} from '../../core/types.js';

interface ActiveRollRow {
  id: number;
  guild_id: number;
  channel_id: string;
  message_id: string | null;
  brainrot_id: number;
  rolled_by_player_id: number;
  status: ActiveRollStatus;
  created_at: string;
  expires_at: string;
  claimed_by_player_id: number | null;
  claimed_at: string | null;
  updated_at: string;
  brainrot_external_id: string;
  brainrot_name: string;
  brainrot_slug: string;
  brainrot_rarity: Rarity;
  brainrot_image_url: string;
  brainrot_description: string;
  brainrot_source_status: SourceStatus;
  brainrot_aliases_json: string;
  brainrot_created_at: string;
  brainrot_updated_at: string;
  rolled_by_discord_user_id: string;
  claimed_by_discord_user_id: string | null;
}

function mapActiveRollRecord(row: ActiveRollRow): ActiveRollRecord {
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
    updatedAt: row.updated_at
  };
}

function mapActiveRollRow(row: ActiveRollRow): ActiveRollWithBrainrot {
  return {
    ...mapActiveRollRecord(row),
    brainrot: {
      databaseId: row.brainrot_id,
      id: row.brainrot_external_id,
      name: row.brainrot_name,
      slug: row.brainrot_slug,
      rarity: row.brainrot_rarity,
      imageUrl: row.brainrot_image_url,
      description: row.brainrot_description,
      sourceStatus: row.brainrot_source_status,
      aliases: JSON.parse(row.brainrot_aliases_json) as string[],
      createdAt: row.brainrot_created_at,
      updatedAt: row.brainrot_updated_at
    },
    rolledByDiscordUserId: row.rolled_by_discord_user_id,
    claimedByDiscordUserId: row.claimed_by_discord_user_id
  };
}

interface CreateActiveRollInput {
  guildId: number;
  channelId: string;
  brainrotId: number;
  rolledByPlayerId: number;
  createdAt: string;
  expiresAt: string;
}

export class ActiveRollRepository {
  public constructor(private readonly database: Database.Database) {}

  public createActiveRoll(input: CreateActiveRollInput): ActiveRollRecord {
    const result = this.database
      .prepare(`
        INSERT INTO active_rolls (
          guild_id,
          channel_id,
          message_id,
          brainrot_id,
          rolled_by_player_id,
          status,
          created_at,
          expires_at,
          claimed_by_player_id,
          claimed_at,
          updated_at
        )
        VALUES (?, ?, NULL, ?, ?, 'active', ?, ?, NULL, NULL, ?)
      `)
      .run(
        input.guildId,
        input.channelId,
        input.brainrotId,
        input.rolledByPlayerId,
        input.createdAt,
        input.expiresAt,
        input.createdAt
      );

    const roll = this.findById(Number(result.lastInsertRowid));

    if (!roll) {
      throw new Error('Impossible de créer le roll actif.');
    }

    return roll;
  }

  public findById(id: number): ActiveRollWithBrainrot | null {
    const row = this.database
      .prepare(`
        SELECT
          ar.*,
          b.external_id as brainrot_external_id,
          b.name as brainrot_name,
          b.slug as brainrot_slug,
          b.rarity as brainrot_rarity,
          b.image_url as brainrot_image_url,
          b.description as brainrot_description,
          b.source_status as brainrot_source_status,
          b.aliases_json as brainrot_aliases_json,
          b.created_at as brainrot_created_at,
          b.updated_at as brainrot_updated_at,
          rp.discord_user_id as rolled_by_discord_user_id,
          cp.discord_user_id as claimed_by_discord_user_id
        FROM active_rolls ar
        JOIN brainrots b ON b.id = ar.brainrot_id
        JOIN players rp ON rp.id = ar.rolled_by_player_id
        LEFT JOIN players cp ON cp.id = ar.claimed_by_player_id
        WHERE ar.id = ?
      `)
      .get(id) as ActiveRollRow | undefined;

    return row ? mapActiveRollRow(row) : null;
  }

  public updateMessageId(rollId: number, messageId: string, timestamp: string): void {
    this.database
      .prepare('UPDATE active_rolls SET message_id = ?, updated_at = ? WHERE id = ?')
      .run(messageId, timestamp, rollId);
  }

  public claimActiveRoll(rollId: number, claimedByPlayerId: number, claimedAt: string, timestamp: string): number {
    const result = this.database
      .prepare(`
        UPDATE active_rolls
        SET
          status = 'claimed',
          claimed_by_player_id = ?,
          claimed_at = ?,
          updated_at = ?
        WHERE id = ? AND status = 'active'
      `)
      .run(claimedByPlayerId, claimedAt, timestamp, rollId);

    return result.changes;
  }

  public deleteByIdIfActive(rollId: number): boolean {
    const result = this.database
      .prepare('DELETE FROM active_rolls WHERE id = ? AND status = \'active\'')
      .run(rollId);

    return result.changes > 0;
  }
}
