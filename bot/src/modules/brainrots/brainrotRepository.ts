import type Database from 'better-sqlite3';

import type { Brainrot, BrainrotRecord, Rarity, SourceStatus } from '../../core/types.js';
import { nowIso } from '../../utils/time.js';
import type { BrainrotRankingEntry } from './brainrotRankingService.js';

interface BrainrotRow {
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

interface BrainrotRankingRow extends BrainrotRow {
  owner_count: number;
  total_owned: number;
  rarity_score: number;
}

function mapBrainrotRow(row: BrainrotRow): BrainrotRecord {
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

export class BrainrotRepository {
  public constructor(private readonly database: Database.Database) {}

  public syncCatalog(brainrots: readonly Brainrot[]): void {
    const insertStatement = this.database.prepare(`
      INSERT INTO brainrots (
        external_id,
        name,
        slug,
        rarity,
        image_url,
        description,
        source_status,
        aliases_json,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(external_id) DO UPDATE SET
        name = excluded.name,
        slug = excluded.slug,
        rarity = excluded.rarity,
        image_url = excluded.image_url,
        description = excluded.description,
        source_status = excluded.source_status,
        aliases_json = excluded.aliases_json,
        updated_at = excluded.updated_at
    `);

    const transaction = this.database.transaction((items: readonly Brainrot[]) => {
      const externalIds = items.map((brainrot) => brainrot.id);

      for (const brainrot of items) {
        const timestamp = nowIso();

        insertStatement.run(
          brainrot.id,
          brainrot.name,
          brainrot.slug,
          brainrot.rarity,
          brainrot.imageUrl,
          brainrot.description,
          brainrot.sourceStatus,
          JSON.stringify(brainrot.aliases),
          timestamp,
          timestamp
        );
      }

      if (externalIds.length === 0) {
        this.database.prepare('DELETE FROM brainrots').run();
        return;
      }

      const placeholders = externalIds.map(() => '?').join(', ');

      this.database
        .prepare(`DELETE FROM brainrots WHERE external_id NOT IN (${placeholders})`)
        .run(...externalIds);
    });

    transaction(brainrots);
  }

  public findAll(): BrainrotRecord[] {
    const rows = this.database
      .prepare('SELECT * FROM brainrots ORDER BY name ASC')
      .all() as BrainrotRow[];

    return rows.map(mapBrainrotRow);
  }

  public findByDatabaseId(id: number): BrainrotRecord | null {
    const row = this.database
      .prepare('SELECT * FROM brainrots WHERE id = ?')
      .get(id) as BrainrotRow | undefined;

    return row ? mapBrainrotRow(row) : null;
  }

  public count(): number {
    const row = this.database
      .prepare('SELECT COUNT(*) as total FROM brainrots')
      .get() as { total: number };

    return row.total;
  }

  public getTopWantedBrainrots(limit: number): BrainrotRankingEntry[] {
    const rows = this.database
      .prepare(`
        SELECT
          b.*,
          COUNT(pb.player_id) as owner_count,
          COALESCE(SUM(pb.quantity), 0) as total_owned,
          CASE b.rarity
            WHEN 'common' THEN 1
            WHEN 'rare' THEN 3
            WHEN 'epic' THEN 10
            WHEN 'legendary' THEN 25
            WHEN 'mythic' THEN 60
          END as rarity_score
        FROM brainrots b
        LEFT JOIN player_brainrots pb ON pb.brainrot_id = b.id
        GROUP BY b.id
        ORDER BY
          CASE b.rarity
            WHEN 'mythic' THEN 5
            WHEN 'legendary' THEN 4
            WHEN 'epic' THEN 3
            WHEN 'rare' THEN 2
            WHEN 'common' THEN 1
          END DESC,
          owner_count ASC,
          total_owned ASC,
          b.name ASC
        LIMIT ?
      `)
      .all(limit) as BrainrotRankingRow[];

    return rows.map((row) => ({
      brainrot: mapBrainrotRow(row),
      rarityScore: row.rarity_score,
      ownerCount: row.owner_count,
      totalOwned: row.total_owned
    }));
  }
}
