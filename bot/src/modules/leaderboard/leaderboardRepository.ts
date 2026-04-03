import type Database from 'better-sqlite3';

import { getScoreFromInventory } from '../../config/game.js';
import type { LeaderboardEntry } from '../../core/types.js';

interface LeaderboardRow {
  player_id: number;
  discord_user_id: string;
  username: string;
  global_name: string | null;
  total_brainrots: number;
  unique_brainrots: number;
  rarity_score: number;
}

const rarityScoreSql = `
  CASE b.rarity
    WHEN 'common' THEN 1
    WHEN 'rare' THEN 3
    WHEN 'epic' THEN 10
    WHEN 'legendary' THEN 25
    WHEN 'mythic' THEN 60
  END
`;

export class LeaderboardRepository {
  public constructor(private readonly database: Database.Database) {}

  public getTopForGuild(guildId: number, limit: number): LeaderboardEntry[] {
    const rows = this.database
      .prepare(`
        SELECT
          p.id as player_id,
          p.discord_user_id,
          p.username,
          p.global_name,
          COALESCE(SUM(pb.quantity), 0) as total_brainrots,
          COUNT(pb.brainrot_id) as unique_brainrots,
          COALESCE(SUM((${rarityScoreSql}) * pb.quantity), 0) as rarity_score
        FROM player_guilds pg
        JOIN players p ON p.id = pg.player_id
        LEFT JOIN player_brainrots pb ON pb.player_id = p.id
        LEFT JOIN brainrots b ON b.id = pb.brainrot_id
        WHERE pg.guild_id = ?
        GROUP BY p.id
        HAVING COALESCE(SUM(pb.quantity), 0) > 0
        ORDER BY
          (COALESCE(SUM((${rarityScoreSql}) * pb.quantity), 0) + COUNT(pb.brainrot_id) * 10 + COALESCE(SUM(pb.quantity), 0)) DESC,
          COUNT(pb.brainrot_id) DESC,
          COALESCE(SUM(pb.quantity), 0) DESC,
          p.username ASC
        LIMIT ?
      `)
      .all(guildId, limit) as LeaderboardRow[];

    return rows.map((row) => ({
      playerId: row.player_id,
      discordUserId: row.discord_user_id,
      username: row.username,
      globalName: row.global_name,
      totalBrainrots: row.total_brainrots,
      uniqueBrainrots: row.unique_brainrots,
      rarityScore: row.rarity_score,
      score: getScoreFromInventory(row.total_brainrots, row.unique_brainrots, row.rarity_score)
    }));
  }
}
