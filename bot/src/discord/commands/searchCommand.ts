import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';

import type { AppContext } from '../../core/appContext.js';
import { replyEphemeral } from '../../utils/discord.js';
import { toDiscordUserSnapshot } from '../../utils/discordUser.js';
import { buildSearchMessage } from '../builders/searchEmbedBuilder.js';
import { ensureConfiguredGameChannel } from '../guards/ensureConfiguredGameChannel.js';
import type { SlashCommandHandler } from '../registry/types.js';

export const searchCommand: SlashCommandHandler = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Recherche un brainrot par nom, slug ou alias.')
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName('brainrot')
        .setDescription('Texte à rechercher dans le catalogue.')
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction, context: AppContext): Promise<void> {
    if (!interaction.guildId) {
      return;
    }

    if (!(await ensureConfiguredGameChannel(interaction, context))) {
      return;
    }

    const user = toDiscordUserSnapshot(interaction.user);
    context.services.playerService.ensurePlayerContext(user, interaction.guildId);

    const view = context.services.brainrotSearchService.search(
      user,
      interaction.options.getString('brainrot', true)
    );

    if (view.entries.length === 0) {
      await replyEphemeral(interaction, {
        content: `Aucun brainrot trouvé pour \`${view.query}\`.`
      });
      return;
    }

    const message = buildSearchMessage(view);

    await interaction.reply({
      embeds: [message.embed],
      files: message.files
    });
  }
};
