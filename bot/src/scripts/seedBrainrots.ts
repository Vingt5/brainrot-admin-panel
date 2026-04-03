import { readFileSync } from 'node:fs';

import { loadEnv } from '../config/env.js';
import { Logger } from '../core/logger.js';
import { isRarity, isSourceStatus, type Brainrot } from '../core/types.js';
import { createDatabase } from '../database/connection.js';
import { runSchema } from '../database/runSchema.js';
import { BrainrotRepository } from '../modules/brainrots/brainrotRepository.js';
import { assertLocalAssetExists, isRemoteAssetUrl, resolveProjectPath } from '../utils/assets.js';

function parseSeedFile(): Brainrot[] {
  const seedPath = resolveProjectPath('data/brainrots.seed.json');
  const fileContents = readFileSync(seedPath, 'utf8');
  const parsed = JSON.parse(fileContents) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error('Le fichier de seed doit contenir un tableau de brainrots.');
  }

  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();

  return parsed.map((item, index) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error(`L’entrée de seed à l’index ${index} n’est pas un objet.`);
    }

    const candidate = item as Record<string, unknown>;
    const { id, name, slug, rarity, imageUrl, description, sourceStatus, aliases } = candidate;

    if (
      typeof id !== 'string' ||
      typeof name !== 'string' ||
      typeof slug !== 'string' ||
      !isRarity(rarity) ||
      typeof imageUrl !== 'string' ||
      typeof description !== 'string' ||
      !isSourceStatus(sourceStatus) ||
      !Array.isArray(aliases) ||
      aliases.some((alias) => typeof alias !== 'string')
    ) {
      throw new Error(`L’entrée de seed à l’index ${index} possède une structure invalide.`);
    }

    if (seenIds.has(id)) {
      throw new Error(`L’identifiant brainrot ${id} est dupliqué dans le seed.`);
    }

    if (seenSlugs.has(slug)) {
      throw new Error(`Le slug brainrot ${slug} est dupliqué dans le seed.`);
    }

    seenIds.add(id);
    seenSlugs.add(slug);

    if (!isRemoteAssetUrl(imageUrl)) {
      assertLocalAssetExists(imageUrl);
    }

    return {
      id,
      name,
      slug,
      rarity,
      imageUrl,
      description,
      sourceStatus,
      aliases
    };
  });
}

const env = loadEnv({ requireDiscord: false });
const logger = new Logger(env.logLevel);
const database = createDatabase(env.databasePath);

runSchema(database);

const brainrotRepository = new BrainrotRepository(database);
const brainrots = parseSeedFile();

brainrotRepository.syncCatalog(brainrots);

logger.info('Seed des brainrots terminé.', {
  imported: brainrots.length,
  databasePath: env.databasePath
});

database.close();
