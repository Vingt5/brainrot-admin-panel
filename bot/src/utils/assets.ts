import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const remoteAssetPattern = /^https?:\/\//i;
const projectRoot = resolve(currentDirectory, '../..');

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
