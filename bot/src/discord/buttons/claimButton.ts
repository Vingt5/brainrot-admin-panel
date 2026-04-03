import type { ButtonInteraction } from 'discord.js';

import type { AppContext } from '../../core/appContext.js';
import { replyEphemeral } from '../../utils/discord.js';
import { toDiscordUserSnapshot } from '../../utils/discordUser.js';
import { formatDuration } from '../../utils/time.js';
import { buildClaimButtonRow, buildClaimedMessage } from '../builders/brainrotMessageBuilder.js';
import type { ButtonHandler } from '../registry/types.js';

export const claimButton: ButtonHandler = {
  customIdPrefix: 'claim:',
  async execute(interaction: ButtonInteraction, context: AppContext): Promise<void> {
    if (!interaction.guildId) {
      return;
    }

    const [, rollIdPart] = interaction.customId.split(':');
    const rollId = Number(rollIdPart);

    if (!Number.isInteger(rollId) || rollId <= 0) {
      await replyEphemeral(interaction, {
        content: 'Ce bouton de reclamation est invalide.'
      });
      return;
    }

    const result = context.services.claimService.claimRoll({
      guildDiscordId: interaction.guildId,
      channelId: interaction.channelId,
      rollId,
      user: toDiscordUserSnapshot(interaction.user)
    });

    switch (result.kind) {
      case 'guild_not_configured':
        await replyEphemeral(interaction, {
          content: 'Aucun salon de jeu n est configure. Utilise `/setup` d abord.'
        });
        return;
      case 'wrong_channel':
        await replyEphemeral(interaction, {
          content: `Les reclamations sont autorisees uniquement dans <#${result.configuredChannelId}>.`
        });
        return;
      case 'not_found':
        await replyEphemeral(interaction, {
          content: 'Ce roll n existe plus.'
        });
        return;
      case 'already_claimed':
        await replyEphemeral(interaction, {
          content: result.claimedByDiscordUserId
            ? `Trop tard. Ce brainrot a deja ete reclame par <@${result.claimedByDiscordUserId}>.`
            : 'Trop tard. Ce brainrot a deja ete reclame.'
        });
        return;
      case 'cooldown':
        await replyEphemeral(interaction, {
          content: `Ta prochaine reclamation sera disponible dans ${formatDuration(result.remainingMs)}.`
        });
        return;
      case 'success': {
        const claimed = buildClaimedMessage(result.roll);

        await interaction.update({
          embeds: [claimed.embed],
          components: [buildClaimButtonRow(result.roll.id, result.roll.brainrot.rarity, 'claimed')],
          files: claimed.files,
          attachments: []
        });
        return;
      }
    }
  }
};
