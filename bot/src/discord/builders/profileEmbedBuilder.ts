import { AttachmentBuilder, EmbedBuilder } from 'discord.js';

import type { ProfileView } from '../../modules/players/profileService.js';
import { getPreferredDisplayName } from '../../utils/player.js';
import { buildEmbedMedia } from './embedMediaBuilder.js';
import {
  buildProgressBar,
  formatCompletion,
  formatDiscordTimestamp,
  formatInteger,
  getRarityDisplay,
  getRarityValueDisplay,
  rarityVisualThemeMap
} from './visualTheme.js';

export interface BuiltProfileMessage {
  readonly embed: EmbedBuilder;
  readonly files: AttachmentBuilder[];
}

export function buildProfileMessage(profile: ProfileView, catalogSize: number): BuiltProfileMessage {
  const displayName = getPreferredDisplayName(profile.user.username, profile.user.globalName);
  const accentRarity = profile.stats.highestOwnedRarity ?? 'common';
  const completionBar = buildProgressBar(profile.stats.uniqueBrainrots, catalogSize, 12);
  const completionLabel = formatCompletion(profile.stats.uniqueBrainrots, catalogSize);

  const embed = new EmbedBuilder()
    .setColor(rarityVisualThemeMap[accentRarity].color)
    .setAuthor({
      name: `📇 Dossier joueur · ${displayName}`
    })
    .setTitle(`${rarityVisualThemeMap[accentRarity].icon} Vue collection`)
    .setDescription(
      [
        '**Complétion du catalogue**',
        `${completionBar} ${formatInteger(profile.stats.uniqueBrainrots)}/${formatInteger(catalogSize)} · ${completionLabel}`,
        '',
        profile.stats.lastObtainedBrainrot
          ? `Dernier gros signal : **${profile.stats.lastObtainedBrainrot.name}**`
          : 'Aucun brainrot sécurisé pour le moment.'
      ].join('\n')
    )
    .addFields(
      {
        name: 'Collection',
        value: `**${formatInteger(profile.stats.totalBrainrots)}** total\n**${formatInteger(profile.stats.uniqueBrainrots)}** uniques`,
        inline: true
      },
      {
        name: 'Puissance',
        value: `**${formatInteger(profile.stats.score)}** score\n**${formatInteger(profile.stats.rarityScore)}** valeur brute`,
        inline: true
      },
      {
        name: 'Collector',
        value: `**${formatInteger(profile.stats.wishCount)}** wishes\n**${formatInteger(profile.stats.favoriteCount)}** favoris`,
        inline: true
      },
      {
        name: 'Meilleure rareté',
        value: profile.stats.highestOwnedRarity
          ? `${getRarityDisplay(profile.stats.highestOwnedRarity)}\n${getRarityValueDisplay(profile.stats.highestOwnedRarity)}`
          : 'Aucune',
        inline: true
      }
    )
    .setFooter({
      text: 'Score = somme des raretés + uniques × 10 + total'
    });

  if (!profile.stats.lastObtainedBrainrot || !profile.stats.lastObtainedAt) {
    return {
      embed,
      files: []
    };
  }

  embed.addFields({
    name: 'Dernier obtenu',
    value: [
      `**${profile.stats.lastObtainedBrainrot.name}**`,
      `${getRarityDisplay(profile.stats.lastObtainedBrainrot.rarity)} · ${formatDiscordTimestamp(profile.stats.lastObtainedAt, 'R')}`,
      profile.stats.lastObtainedBrainrot.description
    ].join('\n')
  });

  const media = buildEmbedMedia(profile.stats.lastObtainedBrainrot.imageUrl);
  embed.setThumbnail(media.source);

  return {
    embed,
    files: media.files
  };
}
