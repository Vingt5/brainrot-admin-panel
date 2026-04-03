import type Database from 'better-sqlite3';

import { applyMigrations } from './applyMigrations.js';

export function runSchema(database: Database.Database): string[] {
  return applyMigrations(database);
}
