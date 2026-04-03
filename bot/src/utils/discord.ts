import {
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  MessageFlags,
  type InteractionReplyOptions
} from 'discord.js';

type ReplyableInteraction = ButtonInteraction | ChatInputCommandInteraction;

export async function replyEphemeral(
  interaction: ReplyableInteraction,
  options: Omit<InteractionReplyOptions, 'flags'>
): Promise<void> {
  const payload: InteractionReplyOptions = {
    ...options,
    flags: MessageFlags.Ephemeral
  };

  if (interaction.deferred || interaction.replied) {
    await interaction.followUp(payload);
    return;
  }

  await interaction.reply(payload);
}

export async function replyPublic(
  interaction: ReplyableInteraction,
  options: InteractionReplyOptions
): Promise<void> {
  if (interaction.deferred || interaction.replied) {
    await interaction.followUp(options);
    return;
  }

  await interaction.reply(options);
}
