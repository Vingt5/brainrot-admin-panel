import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { Logger } from '../core/logger.js';
import { isRemoteAssetUrl, resolveProjectPath } from '../utils/assets.js';

interface BrainrotAssetManifestEntry {
  slug: string;
  targetPath: string;
  sourcePageUrl: string;
  sourceImageUrl: string;
}

function parseManifest(): BrainrotAssetManifestEntry[] {
  const manifestPath = resolveProjectPath('data/brainrot.assets.json');
  const fileContents = readFileSync(manifestPath, 'utf8');
  const parsed = JSON.parse(fileContents) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error('Le manifeste des assets doit contenir un tableau.');
  }

  return parsed.map((item, index) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error(`L’entrée d’asset à l’index ${index} n’est pas un objet.`);
    }

    const candidate = item as Record<string, unknown>;
    const slug = candidate.slug;
    const targetPath = candidate.targetPath;
    const sourcePageUrl = candidate.sourcePageUrl;
    const sourceImageUrl = candidate.sourceImageUrl;

    if (
      typeof slug !== 'string' ||
      typeof targetPath !== 'string' ||
      typeof sourcePageUrl !== 'string' ||
      typeof sourceImageUrl !== 'string'
    ) {
      throw new Error(`L’entrée d’asset à l’index ${index} possède une structure invalide.`);
    }

    if (!isRemoteAssetUrl(sourcePageUrl) || !isRemoteAssetUrl(sourceImageUrl)) {
      throw new Error(`L’entrée d’asset ${slug} doit contenir des URLs HTTP(S) valides.`);
    }

    return {
      slug,
      targetPath,
      sourcePageUrl,
      sourceImageUrl
    };
  });
}

async function downloadAsset(entry: BrainrotAssetManifestEntry, logger: Logger): Promise<'downloaded' | 'skipped'> {
  const absoluteTargetPath = resolveProjectPath(entry.targetPath);
  const force = process.argv.includes('--force');

  if (!force && existsSync(absoluteTargetPath)) {
    logger.debug('Asset déjà présent, téléchargement ignoré.', {
      slug: entry.slug,
      targetPath: entry.targetPath
    });
    return 'skipped';
  }

  const response = await fetch(entry.sourceImageUrl);

  if (!response.ok) {
    throw new Error(
      `Téléchargement impossible pour ${entry.slug} (${response.status} ${response.statusText}).`
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await mkdir(dirname(absoluteTargetPath), { recursive: true });
  await writeFile(absoluteTargetPath, buffer);

  logger.info('Asset téléchargé.', {
    slug: entry.slug,
    targetPath: entry.targetPath,
    sourcePageUrl: entry.sourcePageUrl
  });

  return 'downloaded';
}

async function main(): Promise<void> {
  const logger = new Logger('info');
  const manifest = parseManifest();
  let downloaded = 0;
  let skipped = 0;

  for (const entry of manifest) {
    const status = await downloadAsset(entry, logger);

    if (status === 'downloaded') {
      downloaded += 1;
      continue;
    }

    skipped += 1;
  }

  logger.info('Synchronisation des assets terminée.', {
    total: manifest.length,
    downloaded,
    skipped
  });
}

await main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[ASSETS] ${message}`);
  process.exitCode = 1;
});
