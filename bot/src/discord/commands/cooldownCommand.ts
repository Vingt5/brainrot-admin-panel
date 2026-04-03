import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';

import type { AppContext } from '../../core/appContext.js';
import { replyEphemeral } from '../../utils/discord.js';
import { toDiscordUserSnapshot } from '../../utils/discordUser.js';
import { buildCooldownEmbed } from '../builders/cooldownEmbedBuilder.js';
import { ensureConfiguredGameChannel } from '../guards/ensureConfiguredGameChannel.js';
import type { SlashCommandHandler } from '../registry/types.js';

export const cooldownCommand: SlashCommandHandler = {
  data: new SlashCommandBuilder()
    .setName('cooldown')
    .setDescription('Affiche le temps restant avant ton prochain roll et ta prochaine réclamation.')
    .setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction, context: AppContext): Promise<void> {
    if (!interaction.guildId) {
      return;
    }

    if (!(await ensureConfiguredGameChannel(interaction, context))) {
      return;
    }

    context.services.playerService.ensurePlayerContext(toDiscordUserSnapshot(interaction.user), interaction.guildId);

    const cooldowns = context.services.cooldownService.getCooldowns(interaction.user.id);

    await replyEphemeral(interaction, {
      embeds: [buildCooldownEmbed(cooldowns, context.config.commandPrefix)]
    });
  }
};
