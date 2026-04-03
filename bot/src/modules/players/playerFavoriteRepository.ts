import type Database from 'better-sqlite3';

export class PlayerFavoriteRepository {
  public constructor(private readonly database: Database.Database) {}

  public addFavorite(playerId: number, brainrotId: number, timestamp: string): boolean {
    const result = this.database
      .prepare(`
        INSERT OR IGNORE INTO player_favorites (
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

  public removeFavorite(playerId: number, brainrotId: number): boolean {
    const result = this.database
      .prepare('DELETE FROM player_favorites WHERE player_id = ? AND brainrot_id = ?')
      .run(playerId, brainrotId);

    return result.changes > 0;
  }

  public countForPlayer(playerId: number): number {
    const row = this.database
      .prepare('SELECT COUNT(*) as total FROM player_favorites WHERE player_id = ?')
      .get(playerId) as { total: number };

    return row.total;
  }

  public hasFavorite(playerId: number, brainrotId: number): boolean {
    const row = this.database
      .prepare('SELECT 1 as present FROM player_favorites WHERE player_id = ? AND brainrot_id = ?')
      .get(playerId, brainrotId) as { present: number } | undefined;

    return row?.present === 1;
  }
}
