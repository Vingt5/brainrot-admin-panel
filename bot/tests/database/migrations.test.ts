import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createDatabase } from '../../src/database/connection.js';
import { runSchema } from '../../src/database/runSchema.js';

test('runSchema applique les migrations une seule fois et crée les tables attendues', () => {
  const tempDirectory = mkdtempSync(join(tmpdir(), 'brainrot-bot-migrations-'));
  const database = createDatabase(join(tempDirectory, 'migration-test.sqlite'));

  try {
    const firstRun = runSchema(database);
    const secondRun = runSchema(database);

    assert.deepEqual(firstRun, [
      '0001_initial.sql',
      '0002_player_wishes_and_favorites.sql',
      '0003_allow_multiple_active_rolls_per_channel.sql'
    ]);
    assert.deepEqual(secondRun, []);

    const migrationCount = database
      .prepare('SELECT COUNT(*) AS total FROM schema_migrations')
      .get() as { total: number };

    const tableRows = database
      .prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name IN (
            'schema_migrations',
            'players',
            'guilds',
            'player_guilds',
            'brainrots',
            'player_brainrots',
            'player_wishes',
            'player_favorites',
            'active_rolls'
          )
        ORDER BY name ASC
      `)
      .all() as Array<{ name: string }>;

    assert.equal(migrationCount.total, 3);
    assert.deepEqual(tableRows.map((row) => row.name), [
      'active_rolls',
      'brainrots',
      'guilds',
      'player_brainrots',
      'player_favorites',
      'player_guilds',
      'player_wishes',
      'players',
      'schema_migrations'
    ]);
  } finally {
    database.close();
    rmSync(tempDirectory, { recursive: true, force: true });
  }
});
