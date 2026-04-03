import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';

import type { AppContext } from '../../core/appContext.js';
import { replyEphemeral } from '../../utils/discord.js';
import { toDiscordUserSnapshot } from '../../utils/discordUser.js';
import { ensureConfiguredGameChannel } from '../guards/ensureConfiguredGameChannel.js';
import type { SlashCommandHandler } from '../registry/types.js';
import { formatResolutionError } from './collectorCommandUtils.js';

export const favoriteCommand: SlashCommandHandler = {
  data: new SlashCommandBuilder()
    .setName('favorite')
    .setDescription('Gère tes brainrots favoris.')
    .setDMPermission(false)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Ajoute un brainrot possédé à tes favoris.')
        .addStringOption((option) =>
          option
            .setName('brainrot')
            .setDescription('Nom exact, slug ou alias exact du brainrot.')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Retire un brainrot de tes favoris.')
        .addStringOption((option) =>
          option
            .setName('brainrot')
            .setDescription('Nom exact, slug ou alias exact du brainrot.')
            .setRequired(true)
        )
    ),
  async execute(interaction: ChatInputCommandInteraction, context: AppContext): Promise<void> {
    if (!interaction.guildId) {
      return;
    }

    if (!(await ensureConfiguredGameChannel(interaction, context))) {
      return;
    }

    const user = toDiscordUserSnapshot(interaction.user);
    const subcommand = interaction.options.getSubcommand();
    const query = interaction.options.getString('brainrot', true);

    if (subcommand === 'add') {
      const result = context.services.favoriteService.addFavorite({
        guildDiscordId: interaction.guildId,
        user,
        query
      });

      switch (result.kind) {
        case 'success':
          await replyEphemeral(interaction, {
            content: `Favori ajouté : **${result.brainrot.name}** (${result.totalFavorites} total).`
          });
          return;
        case 'already_favorite':
          await replyEphemeral(interaction, {
            content: `**${result.brainrot.name}** est déjà dans tes favoris.`
          });
          return;
        case 'not_owned':
          await replyEphemeral(interaction, {
            content: `Tu dois posséder **${result.brainrot.name}** avant de le mettre en favori.`
          });
          return;
        case 'ambiguous':
        case 'not_found':
          await replyEphemeral(interaction, {
            content: formatResolutionError(result)
          });
          return;
        case 'not_favorite':
          return;
      }
    }

    if (subcommand === 'remove') {
      const result = context.services.favoriteService.removeFavorite({
        guildDiscordId: interaction.guildId,
        user,
        query
      });

      switch (result.kind) {
        case 'success':
          await replyEphemeral(interaction, {
            content: `Favori retiré : **${result.brainrot.name}** (${result.totalFavorites} restants).`
          });
          return;
        case 'not_favorite':
          await replyEphemeral(interaction, {
            content: `**${result.brainrot.name}** n’est pas dans tes favoris.`
          });
          return;
        case 'ambiguous':
        case 'not_found':
          await replyEphemeral(interaction, {
            content: formatResolutionError(result)
          });
          return;
        case 'already_favorite':
        case 'not_owned':
          return;
      }
    }

    await replyEphemeral(interaction, {
      content: 'Sous-commande `/favorite` inconnue.'
    });
  }
};
