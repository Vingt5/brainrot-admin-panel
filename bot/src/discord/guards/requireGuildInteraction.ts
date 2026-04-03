import type { ButtonInteraction, ChatInputCommandInteraction } from 'discord.js';

import { replyEphemeral } from '../../utils/discord.js';

type SupportedInteraction = ButtonInteraction | ChatInputCommandInteraction;

export async function requireGuildInteraction(interaction: SupportedInteraction): Promise<boolean> {
  if (interaction.inGuild()) {
    return true;
  }

  await replyEphemeral(interaction, {
    content: 'Ce bot fonctionne uniquement à l’intérieur d’un serveur Discord.'
  });

  return false;
}
