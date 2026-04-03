import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';

import type { AppContext } from '../../core/appContext.js';
import { replyEphemeral } from '../../utils/discord.js';
import { buildHelpEmbed } from '../builders/helpEmbedBuilder.js';
import type { SlashCommandHandler } from '../registry/types.js';

export const helpCommand: SlashCommandHandler = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Affiche les commandes disponibles et les règles principales du gameplay.')
    .setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction, context: AppContext): Promise<void> {
    await replyEphemeral(interaction, {
      embeds: [buildHelpEmbed(context.config.commandPrefix)]
    });
  }
};
