import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';

import { ROLL_DELAY_MAX_MS, ROLL_DELAY_MIN_MS } from '../../config/game.js';
import type { AppContext } from '../../core/appContext.js';
import { replyEphemeral } from '../../utils/discord.js';
import { toDiscordUserSnapshot } from '../../utils/discordUser.js';
import { randomInteger } from '../../utils/random.js';
import { sleep } from '../../utils/sleep.js';
import { formatDuration } from '../../utils/time.js';
import { buildClaimButtonRow, buildRevealMessage } from '../builders/brainrotMessageBuilder.js';
import type { SlashCommandHandler } from '../registry/types.js';

export const rollCommand: SlashCommandHandler = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Lance un reveal public de brainrot dans le salon configure.')
    .setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction, context: AppContext): Promise<void> {
    if (!interaction.guildId) {
      return;
    }

    const result = context.services.rollService.createRoll({
      guildDiscordId: interaction.guildId,
      channelId: interaction.channelId,
      user: toDiscordUserSnapshot(interaction.user)
    });

    switch (result.kind) {
      case 'guild_not_configured':
        await replyEphemeral(interaction, {
          content: 'Aucun salon de jeu n est configure. Utilise `/setup` d abord.'
        });
        return;
      case 'wrong_channel':
        await replyEphemeral(interaction, {
          content: `Cette commande est autorisee uniquement dans <#${result.configuredChannelId}>.`
        });
        return;
      case 'cooldown':
        await replyEphemeral(interaction, {
          content: `Ton prochain roll sera disponible dans ${formatDuration(result.remainingMs)}.`
        });
        return;
      case 'no_brainrots':
        await replyEphemeral(interaction, {
          content: 'La base ne contient encore aucun brainrot seede. Lance `npm run db:seed` d abord.'
        });
        return;
      case 'success':
        break;
    }

    try {
      const shouldDeferReply = ROLL_DELAY_MIN_MS > 0 || ROLL_DELAY_MAX_MS > 0;

      if (shouldDeferReply) {
        await interaction.deferReply();
      }

      await sleep(randomInteger(ROLL_DELAY_MIN_MS, ROLL_DELAY_MAX_MS));

      const wishHighlight = context.services.wishService.getRollHighlight(
        interaction.guildId,
        result.roll.brainrot.databaseId
      );
      const reveal = buildRevealMessage(result.roll, wishHighlight);
      const responsePayload = {
        content: wishHighlight.mentionText ?? undefined,
        embeds: [reveal.embed],
        components: [buildClaimButtonRow(result.roll.id, result.roll.brainrot.rarity, 'active')],
        files: reveal.files,
        attachments: [],
        allowedMentions: {
          users: wishHighlight.mentionedDiscordUserIds
        }
      } as const;

      if (shouldDeferReply) {
        await interaction.editReply(responsePayload);
      } else {
        await interaction.reply(responsePayload);
      }

      const reply = await interaction.fetchReply();
      context.services.rollService.attachMessageId(result.roll.id, reply.id);
    } catch (error) {
      context.services.rollService.cancelUnpublishedRoll(result.roll.id);

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: 'Le roll a ete annule car le reveal n a pas pu etre publie.',
          embeds: [],
          components: []
        });
      }

      throw error;
    }
  }
};
