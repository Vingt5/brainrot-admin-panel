import type { ButtonInteraction, ChatInputCommandInteraction } from 'discord.js';

import type { AppContext } from '../../core/appContext.js';
import { replyEphemeral } from '../../utils/discord.js';

type SupportedInteraction = ButtonInteraction | ChatInputCommandInteraction;

export async function ensureConfiguredGameChannel(
  interaction: SupportedInteraction,
  context: AppContext
): Promise<boolean> {
  const guildId = interaction.guildId;
  const channelId = interaction.channelId;

  if (!guildId) {
    return false;
  }

  const guild = context.services.guildService.getGuild(guildId);

  if (!guild?.configuredChannelId) {
    await replyEphemeral(interaction, {
      content: 'Aucun salon de jeu n’est configuré. Utilise `/setup` d’abord.'
    });

    return false;
  }

  if (guild.configuredChannelId !== channelId) {
    await replyEphemeral(interaction, {
      content: `Cette commande est autorisée uniquement dans <#${guild.configuredChannelId}>.`
    });

    return false;
  }

  return true;
}
