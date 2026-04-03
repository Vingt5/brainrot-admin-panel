import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction
} from 'discord.js';

import type { AppContext } from '../../core/appContext.js';
import { replyEphemeral } from '../../utils/discord.js';
import { requireAdministrator } from '../guards/requireAdministrator.js';
import type { SlashCommandHandler } from '../registry/types.js';

export const setupCommand: SlashCommandHandler = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Gère le salon de jeu autorisé pour ce serveur.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set')
        .setDescription('Définit le salon texte autorisé pour le gameplay.')
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('Le salon texte dans lequel le bot est autorisé à fonctionner.')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('status')
        .setDescription('Affiche le salon actuellement configuré pour ce serveur.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('reset')
        .setDescription('Retire la configuration actuelle du salon de jeu.')
    ),
  async execute(interaction: ChatInputCommandInteraction, context: AppContext): Promise<void> {
    if (!interaction.guildId) {
      return;
    }

    if (!(await requireAdministrator(interaction))) {
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'set': {
        const channel = interaction.options.getChannel('channel', true);
        const guild = context.services.setupService.configureGuildChannel(interaction.guildId, channel.id);

        await replyEphemeral(interaction, {
          content: `Salon de jeu configuré avec succès : <#${guild.configuredChannelId}>`
        });
        return;
      }
      case 'status': {
        const guild = context.services.setupService.getGuildSetup(interaction.guildId);

        await replyEphemeral(interaction, {
          content: guild?.configuredChannelId
            ? `Salon actuellement configuré : <#${guild.configuredChannelId}>`
            : 'Aucun salon de jeu n’est actuellement configuré sur ce serveur.'
        });
        return;
      }
      case 'reset': {
        context.services.setupService.resetGuildChannel(interaction.guildId);

        await replyEphemeral(interaction, {
          content: 'Configuration du salon de jeu supprimée. Le bot refusera désormais les commandes de gameplay jusqu’à un nouveau `/setup set`.'
        });
        return;
      }
      default: {
        await replyEphemeral(interaction, {
          content: 'Sous-commande `/setup` inconnue.'
        });
      }
    }
  }
};
