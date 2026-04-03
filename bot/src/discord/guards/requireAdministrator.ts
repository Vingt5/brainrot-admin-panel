import { PermissionFlagsBits, type ChatInputCommandInteraction } from 'discord.js';

import { replyEphemeral } from '../../utils/discord.js';

export async function requireAdministrator(interaction: ChatInputCommandInteraction): Promise<boolean> {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  await replyEphemeral(interaction, {
    content: 'Seuls les administrateurs peuvent utiliser `/setup`.'
  });

  return false;
}
