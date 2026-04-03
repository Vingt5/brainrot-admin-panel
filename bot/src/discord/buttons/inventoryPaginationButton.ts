import type { ButtonInteraction } from 'discord.js';

import type { AppContext } from '../../core/appContext.js';
import { isInventorySort } from '../../core/types.js';
import { replyEphemeral } from '../../utils/discord.js';
import { buildInventoryMessage, buildInventoryPaginationRow } from '../builders/inventoryEmbedBuilder.js';
import { ensureConfiguredGameChannel } from '../guards/ensureConfiguredGameChannel.js';
import { ensureInventoryOwner } from '../guards/ensureInventoryOwner.js';
import type { ButtonHandler } from '../registry/types.js';

export const inventoryPaginationButton: ButtonHandler = {
  customIdPrefix: 'inventory:',
  async execute(interaction: ButtonInteraction, context: AppContext): Promise<void> {
    if (!interaction.guildId) {
      return;
    }

    if (!(await ensureConfiguredGameChannel(interaction, context))) {
      return;
    }

    const parts = interaction.customId.split(':');

    if (parts.length !== 5 && parts.length !== 6) {
      await replyEphemeral(interaction, {
        content: 'Ce bouton d’inventaire est invalide.'
      });
      return;
    }

    const requesterId = parts[1];
    const targetUserId = parts[2];
    const sortValue = parts[3];
    const pageValue = parts[4];
    const favoriteFlag = parts[5] ?? '0';

    if (!requesterId || !targetUserId || !sortValue || !pageValue) {
      await replyEphemeral(interaction, {
        content: 'Ce bouton d’inventaire est invalide.'
      });
      return;
    }

    if (!(await ensureInventoryOwner(interaction, requesterId))) {
      return;
    }

    if (!isInventorySort(sortValue)) {
      await replyEphemeral(interaction, {
        content: 'Ce mode de tri d’inventaire est invalide.'
      });
      return;
    }

    const pageNumber = Number(pageValue);

    if (!Number.isInteger(pageNumber) || pageNumber <= 0) {
      await replyEphemeral(interaction, {
        content: 'Cette page d’inventaire est invalide.'
      });
      return;
    }

    const favoritesOnly = favoriteFlag === '1';
    const storedPlayer = context.services.playerService.findByDiscordUserId(targetUserId);
    const fetchedUser = storedPlayer ? null : await interaction.client.users.fetch(targetUserId).catch(() => null);

    const snapshot =
      storedPlayer === null
        ? {
            discordUserId: targetUserId,
            username: fetchedUser?.username ?? 'Utilisateur inconnu',
            globalName: fetchedUser?.globalName ?? null
          }
        : {
            discordUserId: storedPlayer.discordUserId,
            username: storedPlayer.username,
            globalName: storedPlayer.globalName
          };

    const inventoryPage = context.services.inventoryService.getInventory(snapshot, sortValue, pageNumber, {
      favoritesOnly
    });
    const message = buildInventoryMessage(inventoryPage, context.services.brainrotService.countBrainrots());

    await interaction.update({
      embeds: [message.embed],
      components: [
        buildInventoryPaginationRow(
          requesterId,
          targetUserId,
          sortValue,
          inventoryPage.page,
          inventoryPage.totalPages,
          favoritesOnly
        )
      ],
      files: message.files,
      attachments: []
    });
  }
};
