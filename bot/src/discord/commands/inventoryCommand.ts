import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';

import type { AppContext } from '../../core/appContext.js';
import { inventorySortValues, isInventorySort } from '../../core/types.js';
import { toDiscordUserSnapshot } from '../../utils/discordUser.js';
import { buildInventoryMessage, buildInventoryPaginationRow } from '../builders/inventoryEmbedBuilder.js';
import { ensureConfiguredGameChannel } from '../guards/ensureConfiguredGameChannel.js';
import type { SlashCommandHandler } from '../registry/types.js';

const inventorySortChoices = [
  { name: 'Rareté', value: 'rarity' },
  { name: 'Quantité', value: 'quantity' },
  { name: 'Récent', value: 'recent' },
  { name: 'Alphabétique', value: 'alphabetical' }
] as const satisfies ReadonlyArray<{ name: string; value: (typeof inventorySortValues)[number] }>;

export const inventoryCommand: SlashCommandHandler = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Parcourt la collection de toi-même ou d’un autre joueur.')
    .setDMPermission(false)
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('Le joueur dont tu veux consulter l’inventaire.')
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('sort')
        .setDescription('Ordre de tri de l’inventaire.')
        .setRequired(false)
        .addChoices(...inventorySortChoices)
    )
    .addBooleanOption((option) =>
      option
        .setName('favorites_only')
        .setDescription('N’affiche que les brainrots marqués comme favoris.')
        .setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction, context: AppContext): Promise<void> {
    if (!interaction.guildId) {
      return;
    }

    if (!(await ensureConfiguredGameChannel(interaction, context))) {
      return;
    }

    context.services.playerService.ensurePlayerContext(toDiscordUserSnapshot(interaction.user), interaction.guildId);

    const targetUser = interaction.options.getUser('user') ?? interaction.user;
    const sortValue = interaction.options.getString('sort') ?? 'rarity';
    const sort = isInventorySort(sortValue) ? sortValue : 'rarity';
    const favoritesOnly = interaction.options.getBoolean('favorites_only') ?? false;
    const page = context.services.inventoryService.getInventory(toDiscordUserSnapshot(targetUser), sort, 1, {
      favoritesOnly
    });
    const message = buildInventoryMessage(page, context.services.brainrotService.countBrainrots());

    await interaction.reply({
      embeds: [message.embed],
      components: [
        buildInventoryPaginationRow(
          interaction.user.id,
          targetUser.id,
          sort,
          page.page,
          page.totalPages,
          favoritesOnly
        )
      ],
      files: message.files
    });
  }
};
