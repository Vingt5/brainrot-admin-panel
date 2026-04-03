import { prefixCommands } from '../commands/prefixCommands.js';
import type { PrefixCommandHandler } from './types.js';

export function buildPrefixCommandRegistry(): Map<string, PrefixCommandHandler> {
  const registry = new Map<string, PrefixCommandHandler>();

  for (const command of prefixCommands) {
    for (const alias of command.aliases) {
      registry.set(alias, command);
    }
  }

  return registry;
}
