import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { resolveProjectPath } from '../utils/assets.js';

function collectTestFiles(directoryPath: string): string[] {
  return readdirSync(directoryPath, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        return collectTestFiles(entryPath);
      }

      return entry.isFile() && entry.name.endsWith('.test.ts') ? [entryPath] : [];
    })
    .sort((left, right) => left.localeCompare(right));
}

const testsDirectory = resolveProjectPath('tests');
const testFiles = collectTestFiles(testsDirectory);

if (testFiles.length === 0) {
  console.error('Aucun fichier de test n’a été trouvé.');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', ...testFiles], {
  stdio: 'inherit'
});

process.exit(result.status ?? 1);
