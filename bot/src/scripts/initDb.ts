import { loadEnv } from '../config/env.js';
import { Logger } from '../core/logger.js';
import { createDatabase } from '../database/connection.js';
import { runSchema } from '../database/runSchema.js';

const env = loadEnv({ requireDiscord: false });
const logger = new Logger(env.logLevel);
const database = createDatabase(env.databasePath);
const appliedMigrations = runSchema(database);

logger.info('Schéma de base de données initialisé.', {
  databasePath: env.databasePath,
  appliedMigrations
});

database.close();
