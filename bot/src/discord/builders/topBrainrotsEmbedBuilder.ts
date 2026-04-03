import { AttachmentBuilder, EmbedBuilder } from 'discord.js';

import type { BrainrotRankingView } from '../../modules/brainrots/brainrotRankingService.js';
import { buildEmbedMedia } from './embedMediaBuilder.js';
import {
  formatInteger,
  getLeaderboardRankIcon,
  getRarityDisplay,
  getRarityValueDisplay,
  rarityVisualThemeMap
} from './visualTheme.js';

export interface BuiltTopBrainrotsMessage {
  readonly embed: EmbedBuilder;
  readonly files: AttachmentBuilder[];
}

function buildEntryLine(index: number, entry: BrainrotRankingView['entries'][number]): string {
  const circulationLabel =
    entry.ownerCount === 0
      ? 'Aucun propriétaire'
      : `${formatInteger(entry.ownerCount)} propriétaire${entry.ownerCount > 1 ? 's' : ''} • ${formatInteger(entry.totalOwned)} copie${entry.totalOwned > 1 ? 's' : ''}`;

  return [
    `${getLeaderboardRankIcon(index)} **${entry.brainrot.name}**`,
    `└ ${getRarityDisplay(entry.brainrot.rarity)} • ${getRarityValueDisplay(entry.brainrot.rarity)} • ${circulationLabel}`
  ].join('\n');
}

export function buildTopBrainrotsMessage(view: BrainrotRankingView): BuiltTopBrainrotsMessage {
  const leader = view.entries[0];
  const accentRarity = leader?.brainrot.rarity ?? 'common';
  const description =
    view.entries.length > 0
      ? view.entries.map((entry, index) => buildEntryLine(index, entry)).join('\n\n')
      : 'Aucun brainrot disponible pour le classement.';

  const embed = new EmbedBuilder()
    .setColor(rarityVisualThemeMap[accentRarity].color)
    .setAuthor({
      name: '👑 Classement des brainrots à viser'
    })
    .setTitle(leader ? 'Meta des drops les plus convoités' : 'Aucun classement disponible')
    .setDescription(description)
    .setFooter({
      text: 'Classement : rareté d’abord, puis rareté réelle en collection selon propriétaires et copies'
    });

  if (!leader) {
    return {
      embed,
      files: []
    };
  }

  embed.addFields({
    name: 'Focus actuel',
    value: [
      `**${leader.brainrot.name}**`,
      `${getRarityDisplay(leader.brainrot.rarity)} • ${getRarityValueDisplay(leader.brainrot.rarity)}`,
      leader.ownerCount === 0
        ? 'Encore absent de toutes les collections.'
        : `${formatInteger(leader.ownerCount)} propriétaire${leader.ownerCount > 1 ? 's' : ''} pour ${formatInteger(leader.totalOwned)} copie${leader.totalOwned > 1 ? 's' : ''}.`,
      leader.brainrot.description
    ].join('\n')
  });

  const media = buildEmbedMedia(leader.brainrot.imageUrl);
  embed.setThumbnail(media.source);

  return {
    embed,
    files: media.files
  };
}
