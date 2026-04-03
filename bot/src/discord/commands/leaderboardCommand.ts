import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';

import type { AppContext } from '../../core/appContext.js';
import { buildLeaderboardEmbed } from '../builders/leaderboardEmbedBuilder.js';
import { ensureConfiguredGameChannel } from '../guards/ensureConfiguredGameChannel.js';
import type { SlashCommandHandler } from '../registry/types.js';
import { toDiscordUserSnapshot } from '../../utils/discordUser.js';

export const leaderboardCommand: SlashCommandHandler = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Affiche les meilleurs collectionneurs de ce serveur.')
    .setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction, context: AppContext): Promise<void> {
    if (!interaction.guildId) {
      return;
    }

    if (!(await ensureConfiguredGameChannel(interaction, context))) {
      return;
    }

    context.services.playerService.ensurePlayerContext(toDiscordUserSnapshot(interaction.user), interaction.guildId);

    const view = context.services.leaderboardService.getLeaderboard(interaction.guildId);

    await interaction.reply({
      embeds: [buildLeaderboardEmbed(view)]
    });
  }
};
