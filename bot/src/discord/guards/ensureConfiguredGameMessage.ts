import type { Message } from 'discord.js';

import type { AppContext } from '../../core/appContext.js';

export async function ensureConfiguredGameMessage(
  message: Message<true>,
  context: AppContext
): Promise<boolean> {
  const guild = context.services.guildService.getGuild(message.guildId);

  if (!guild?.configuredChannelId) {
    await message.reply({
      content: `Aucun salon de jeu n’est configuré. Utilise \`${context.config.commandPrefix}setup set #salon\` ou \`/setup set\` d’abord.`
    });

    return false;
  }

  if (guild.configuredChannelId !== message.channelId) {
    await message.reply({
      content: `Cette commande est autorisée uniquement dans <#${guild.configuredChannelId}>.`
    });

    return false;
  }

  return true;
}
