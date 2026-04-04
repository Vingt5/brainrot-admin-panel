import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const remoteAssetPattern = /^https?:\/\//i;

function detectProjectRoot(startDirectory: string): string {
  let current = startDirectory;

  while (true) {
    if (existsSync(resolve(current, 'package.json')) && existsSync(resolve(current, 'src'))) {
      return current;
    }

    const parent = resolve(current, '..');

    if (parent === current) {
      throw new Error(`Impossible de resoudre la racine projet depuis ${startDirectory}`);
    }

    current = parent;
  }
}

const projectRoot = detectProjectRoot(currentDirectory);

export function isRemoteAssetUrl(value: string): boolean {
  return remoteAssetPattern.test(value);
}

export function resolveProjectPath(...segments: string[]): string {
  return resolve(projectRoot, ...segments);
}

export function resolveLocalAssetPath(assetPath: string): string {
  return resolveProjectPath(assetPath);
}

export function assertLocalAssetExists(assetPath: string): string {
  const absolutePath = resolveLocalAssetPath(assetPath);

  if (!existsSync(absolutePath)) {
    throw new Error(`Asset local introuvable : ${absolutePath}`);
  }

  return absolutePath;
}
