import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';

import type { ActiveRollWithBrainrot, Rarity, WishRollHighlight } from '../../core/types.js';
import { buildEmbedMedia } from './embedMediaBuilder.js';
import { formatDiscordTimestamp, getRarityDisplay, getRarityValueDisplay, rarityVisualThemeMap } from './visualTheme.js';

export interface BuiltEmbedMessage {
  readonly embed: EmbedBuilder;
  readonly files: AttachmentBuilder[];
}

type ClaimRowState = 'active' | 'claimed';

function summarizeDescription(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return '';
  }

  const sentenceEndIndex = normalized.search(/[.!?](?:\s|$)/);

  if (sentenceEndIndex >= 0) {
    const sentence = normalized.slice(0, sentenceEndIndex + 1).trim();

    if (sentence.length <= maxLength) {
      return sentence;
    }
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(1, maxLength - 1)).trimEnd()}...`;
}

function createButton(options: {
  customId: string;
  label?: string;
  style: ButtonStyle;
  disabled?: boolean;
  emoji?: string;
}): ButtonBuilder {
  const button = new ButtonBuilder()
    .setCustomId(options.customId)
    .setStyle(options.style)
    .setDisabled(options.disabled ?? false);

  if (options.label) {
    button.setLabel(options.label);
  }

  if (options.emoji) {
    button.setEmoji(options.emoji);
  }

  return button;
}

function buildClaimStatusRow(
  rollId: number,
  _rarity: Rarity,
  state: ClaimRowState
): ActionRowBuilder<ButtonBuilder> {
  if (state === 'active') {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      createButton({
        customId: `claim:${rollId}`,
        style: ButtonStyle.Secondary,
        emoji: '💘'
      })
    );
  }

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    createButton({
      customId: `claim-status:${rollId}:claimed`,
      label: 'Reclame',
      style: ButtonStyle.Success,
      disabled: true,
      emoji: '❤️'
    })
  );
}

function buildRollEmbedBase(roll: ActiveRollWithBrainrot): BuiltEmbedMessage {
  const media = buildEmbedMedia(roll.brainrot.imageUrl);
  const theme = rarityVisualThemeMap[roll.brainrot.rarity];

  const embed = new EmbedBuilder()
    .setColor(theme.color)
    .setTitle(roll.brainrot.name)
    .setImage(media.source);

  return {
    embed,
    files: media.files
  };
}

function buildCompactDescription(roll: ActiveRollWithBrainrot): string {
  return summarizeDescription(roll.brainrot.description, 110);
}

export function buildClaimButtonRow(
  rollId: number,
  rarity: Rarity,
  state: ClaimRowState = 'active'
): ActionRowBuilder<ButtonBuilder> {
  return buildClaimStatusRow(rollId, rarity, state);
}

export function buildRevealMessage(
  roll: ActiveRollWithBrainrot,
  wishHighlight?: WishRollHighlight
): BuiltEmbedMessage {
  const built = buildRollEmbedBase(roll);
  const descriptionLines = [
    `${getRarityDisplay(roll.brainrot.rarity)} · ${getRarityValueDisplay(roll.brainrot.rarity)}`,
    '',
    `> ${buildCompactDescription(roll)}`
  ];

  if (wishHighlight && wishHighlight.totalWishers > 0) {
    descriptionLines.push('', `💫 Wish detectee · ${wishHighlight.totalWishers} joueur${wishHighlight.totalWishers > 1 ? 's' : ''}`);
  }

  built.embed.setDescription(descriptionLines.join('\n'));

  return built;
}

export function buildClaimedMessage(roll: ActiveRollWithBrainrot): BuiltEmbedMessage {
  const built = buildRollEmbedBase(roll);
  const claimedAt = roll.claimedAt ?? roll.updatedAt;
  const claimedBy = roll.claimedByDiscordUserId ? `<@${roll.claimedByDiscordUserId}>` : 'quelqu un';

  built.embed.setDescription(
    [
      `${getRarityDisplay(roll.brainrot.rarity)} · ${getRarityValueDisplay(roll.brainrot.rarity)}`,
      '',
      `❤️ Reclame par ${claimedBy} · ${formatDiscordTimestamp(claimedAt, 'R')}`,
      `> ${buildCompactDescription(roll)}`
    ].join('\n')
  );

  return built;
}
