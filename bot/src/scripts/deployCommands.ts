import { REST, Routes } from 'discord.js';

import { loadEnv } from '../config/env.js';
import { Logger } from '../core/logger.js';
import { slashCommands } from '../discord/registry/commandRegistry.js';

const env = loadEnv({ requireDiscord: true, requireGuildId: true });
const logger = new Logger(env.logLevel);

if (!env.discordToken || !env.discordClientId || !env.discordGuildId) {
  throw new Error('DISCORD_TOKEN, DISCORD_CLIENT_ID et DISCORD_GUILD_ID sont requis.');
}

const rest = new REST({ version: '10' }).setToken(env.discordToken);
const commandPayloads = slashCommands.map((command) => command.data.toJSON());

await rest.put(Routes.applicationGuildCommands(env.discordClientId, env.discordGuildId), {
  body: commandPayloads
});

logger.info('Les commandes slash de la guilde ont été déployées avec succès.', {
  guildId: env.discordGuildId,
  commandCount: commandPayloads.length
});
