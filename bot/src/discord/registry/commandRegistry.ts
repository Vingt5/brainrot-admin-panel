import { cooldownCommand } from '../commands/cooldownCommand.js';
import { favoriteCommand } from '../commands/favoriteCommand.js';
import { helpCommand } from '../commands/helpCommand.js';
import { inventoryCommand } from '../commands/inventoryCommand.js';
import { leaderboardCommand } from '../commands/leaderboardCommand.js';
import { profileCommand } from '../commands/profileCommand.js';
import { rollCommand } from '../commands/rollCommand.js';
import { searchCommand } from '../commands/searchCommand.js';
import { setupCommand } from '../commands/setupCommand.js';
import { topBrainrotsCommand } from '../commands/topBrainrotsCommand.js';
import { wishCommand } from '../commands/wishCommand.js';
import type { SlashCommandHandler } from './types.js';

export const slashCommands: readonly SlashCommandHandler[] = [
  setupCommand,
  rollCommand,
  profileCommand,
  inventoryCommand,
  wishCommand,
  favoriteCommand,
  searchCommand,
  leaderboardCommand,
  topBrainrotsCommand,
  cooldownCommand,
  helpCommand
];

export function buildCommandRegistry(): Map<string, SlashCommandHandler> {
  return new Map(slashCommands.map((command) => [command.data.name, command]));
}
