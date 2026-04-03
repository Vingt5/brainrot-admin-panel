import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Message,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder
} from 'discord.js';

import type { AppContext } from '../../core/appContext.js';

export type SupportedSlashCommandBuilder =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder;

export interface SlashCommandHandler {
  data: SupportedSlashCommandBuilder;
  execute(interaction: ChatInputCommandInteraction, context: AppContext): Promise<void>;
}

export interface PrefixCommandHandler {
  aliases: readonly string[];
  execute(message: Message<true>, args: string[], context: AppContext): Promise<void>;
}

export interface ButtonHandler {
  customIdPrefix: string;
  execute(interaction: ButtonInteraction, context: AppContext): Promise<void>;
}
