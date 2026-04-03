import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';

import type { AppContext } from '../../core/appContext.js';
import { buildTopBrainrotsMessage } from '../builders/topBrainrotsEmbedBuilder.js';
import { ensureConfiguredGameChannel } from '../guards/ensureConfiguredGameChannel.js';
import type { SlashCommandHandler } from '../registry/types.js';

const DEFAULT_LIMIT = 10;
const MIN_LIMIT = 3;
const MAX_LIMIT = 15;

function clampLimit(limit: number | null): number {
  if (limit === null) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(limit, MIN_LIMIT), MAX_LIMIT);
}

export const topBrainrotsCommand: SlashCommandHandler = {
  data: new SlashCommandBuilder()
    .setName('topbrainrots')
    .setDescription('Affiche les brainrots les plus convoités à avoir.')
    .setDMPermission(false)
    .addIntegerOption((option) =>
      option
        .setName('limit')
        .setDescription('Nombre de brainrots à afficher.')
        .setMinValue(MIN_LIMIT)
        .setMaxValue(MAX_LIMIT)
        .setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction, context: AppContext): Promise<void> {
    if (!interaction.guildId) {
      return;
    }

    if (!(await ensureConfiguredGameChannel(interaction, context))) {
      return;
    }

    const limit = clampLimit(interaction.options.getInteger('limit'));
    const view = context.services.brainrotRankingService.getTopBrainrots(limit);
    const message = buildTopBrainrotsMessage(view);

    await interaction.reply({
      embeds: [message.embed],
      files: message.files
    });
  }
};
