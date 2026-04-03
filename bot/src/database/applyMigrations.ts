import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type Database from 'better-sqlite3';

import { resolveProjectPath } from '../utils/assets.js';
import { nowIso } from '../utils/time.js';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const runtimeMigrationsDirectory = resolve(currentDirectory, 'migrations');
const sourceMigrationsDirectory = resolveProjectPath('src', 'database', 'migrations');

interface MigrationRow {
  name: string;
}

function resolveMigrationsDirectory(): string {
  if (existsSync(runtimeMigrationsDirectory)) {
    return runtimeMigrationsDirectory;
  }

  if (existsSync(sourceMigrationsDirectory)) {
    return sourceMigrationsDirectory;
  }

  throw new Error(
    `Aucun dossier de migrations trouvé. Chemins testés : ${runtimeMigrationsDirectory}, ${sourceMigrationsDirectory}`
  );
}

function ensureMigrationTable(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    );
  `);
}

function listMigrationFiles(migrationsDirectory: string): string[] {
  return readdirSync(migrationsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && extname(entry.name) === '.sql')
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

function getAppliedMigrationNames(database: Database.Database): Set<string> {
  const rows = database
    .prepare('SELECT name FROM schema_migrations ORDER BY name ASC')
    .all() as MigrationRow[];

  return new Set(rows.map((row) => row.name));
}

export function applyMigrations(database: Database.Database): string[] {
  ensureMigrationTable(database);

  const migrationsDirectory = resolveMigrationsDirectory();
  const migrationFiles = listMigrationFiles(migrationsDirectory);
  const appliedMigrationNames = getAppliedMigrationNames(database);
  const insertMigrationStatement = database.prepare(`
    INSERT INTO schema_migrations (name, applied_at)
    VALUES (?, ?)
  `);

  const appliedDuringRun: string[] = [];

  for (const migrationFile of migrationFiles) {
    if (appliedMigrationNames.has(migrationFile)) {
      continue;
    }

    const migrationPath = resolve(migrationsDirectory, migrationFile);
    const migrationSql = readFileSync(migrationPath, 'utf8');
    const applyMigration = database.transaction(() => {
      database.exec(migrationSql);
      insertMigrationStatement.run(migrationFile, nowIso());
    });

    applyMigration();
    appliedDuringRun.push(migrationFile);
  }

  return appliedDuringRun;
}
