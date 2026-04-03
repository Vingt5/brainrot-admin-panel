import type { ButtonInteraction } from 'discord.js';

import { replyEphemeral } from '../../utils/discord.js';

export async function ensureInventoryOwner(interaction: ButtonInteraction, requesterId: string): Promise<boolean> {
  if (interaction.user.id === requesterId) {
    return true;
  }

  await replyEphemeral(interaction, {
    content: 'Seul l’utilisateur qui a ouvert cet inventaire peut utiliser ces boutons de pagination.'
  });

  return false;
}
