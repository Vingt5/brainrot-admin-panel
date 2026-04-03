import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';

import type { AppContext } from '../../core/appContext.js';
import { toDiscordUserSnapshot } from '../../utils/discordUser.js';
import { buildProfileMessage } from '../builders/profileEmbedBuilder.js';
import { ensureConfiguredGameChannel } from '../guards/ensureConfiguredGameChannel.js';
import type { SlashCommandHandler } from '../registry/types.js';

export const profileCommand: SlashCommandHandler = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Affiche les statistiques de collection pour toi ou un autre joueur.')
    .setDMPermission(false)
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('Le joueur à inspecter.')
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
    const profile = context.services.profileService.getProfile(toDiscordUserSnapshot(targetUser));
    const message = buildProfileMessage(profile, context.services.brainrotService.countBrainrots());

    await interaction.reply({
      embeds: [message.embed],
      files: message.files
    });
  }
};
