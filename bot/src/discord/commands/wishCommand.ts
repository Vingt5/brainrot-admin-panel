import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';

import type { AppContext } from '../../core/appContext.js';
import { replyEphemeral } from '../../utils/discord.js';
import { toDiscordUserSnapshot } from '../../utils/discordUser.js';
import { buildWishListMessage } from '../builders/wishListEmbedBuilder.js';
import { ensureConfiguredGameChannel } from '../guards/ensureConfiguredGameChannel.js';
import type { SlashCommandHandler } from '../registry/types.js';
import { formatResolutionError } from './collectorCommandUtils.js';

export const wishCommand: SlashCommandHandler = {
  data: new SlashCommandBuilder()
    .setName('wish')
    .setDescription('Gère ta wishlist de brainrots.')
    .setDMPermission(false)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Ajoute un brainrot à ta wishlist.')
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
        .setDescription('Retire un brainrot de ta wishlist.')
        .addStringOption((option) =>
          option
            .setName('brainrot')
            .setDescription('Nom exact, slug ou alias exact du brainrot.')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('list')
        .setDescription('Affiche ta wishlist actuelle.')
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

    switch (subcommand) {
      case 'add': {
        const result = context.services.wishService.addWish({
          guildDiscordId: interaction.guildId,
          user,
          query: interaction.options.getString('brainrot', true)
        });

        switch (result.kind) {
          case 'success':
            await replyEphemeral(interaction, {
              content: `Wish ajoutée : **${result.brainrot.name}** (${result.totalWishes}/10).`
            });
            return;
          case 'duplicate':
            await replyEphemeral(interaction, {
              content: `**${result.brainrot.name}** est déjà dans ta wishlist (${result.totalWishes}/10).`
            });
            return;
          case 'limit_reached':
            await replyEphemeral(interaction, {
              content: `Ta wishlist est pleine (${result.totalWishes}/${result.limit}). Retire une wish avant d’en ajouter une autre.`
            });
            return;
          case 'ambiguous':
          case 'not_found':
            await replyEphemeral(interaction, {
              content: formatResolutionError(result)
            });
            return;
          case 'not_wished':
            return;
        }
      }
      case 'remove': {
        const result = context.services.wishService.removeWish({
          guildDiscordId: interaction.guildId,
          user,
          query: interaction.options.getString('brainrot', true)
        });

        switch (result.kind) {
          case 'success':
            await replyEphemeral(interaction, {
              content: `Wish retirée : **${result.brainrot.name}** (${result.totalWishes}/10 restantes).`
            });
            return;
          case 'not_wished':
            await replyEphemeral(interaction, {
              content: `**${result.brainrot.name}** n’est pas dans ta wishlist.`
            });
            return;
          case 'ambiguous':
          case 'not_found':
            await replyEphemeral(interaction, {
              content: formatResolutionError(result)
            });
            return;
          case 'duplicate':
          case 'limit_reached':
            return;
        }
      }
      case 'list': {
        const view = context.services.wishService.listWishes({
          guildDiscordId: interaction.guildId,
          user
        });
        const message = buildWishListMessage(view);

        await replyEphemeral(interaction, {
          embeds: [message.embed],
          files: message.files
        });
        return;
      }
      default:
        await replyEphemeral(interaction, {
          content: 'Sous-commande `/wish` inconnue.'
        });
    }
  }
};
