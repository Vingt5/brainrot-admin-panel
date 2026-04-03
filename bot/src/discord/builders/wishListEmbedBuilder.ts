import { AttachmentBuilder, EmbedBuilder } from 'discord.js';

import type { WishListView } from '../../modules/players/wishService.js';
import { getPreferredDisplayName } from '../../utils/player.js';
import { buildEmbedMedia } from './embedMediaBuilder.js';
import { formatInteger, getRarityDisplay, rarityVisualThemeMap } from './visualTheme.js';

export interface BuiltWishListMessage {
  readonly embed: EmbedBuilder;
  readonly files: AttachmentBuilder[];
}

function buildWishLine(index: number, view: WishListView['entries'][number]): string {
  return `${index}. **${view.name}**\n└ ${getRarityDisplay(view.rarity)}`;
}

export function buildWishListMessage(view: WishListView): BuiltWishListMessage {
  const displayName = getPreferredDisplayName(view.user.username, view.user.globalName);
  const previewItem = view.entries[0];
  const accentRarity = previewItem?.rarity ?? 'common';
  const description =
    view.entries.length > 0
      ? view.entries.map((entry, index) => buildWishLine(index + 1, entry)).join('\n\n')
      : 'Aucune wish active pour le moment.';

  const embed = new EmbedBuilder()
    .setColor(rarityVisualThemeMap[accentRarity].color)
    .setAuthor({
      name: `💫 Wishlist · ${displayName}`
    })
    .setTitle(view.totalEntries > 0 ? 'Cibles en attente' : 'Wishlist vide')
    .setDescription(description)
    .addFields({
      name: 'Capacité',
      value: `${formatInteger(view.totalEntries)}/${formatInteger(view.limit)}`,
      inline: true
    });

  if (!previewItem) {
    return {
      embed,
      files: []
    };
  }

  embed.addFields({
    name: 'Focus',
    value: [
      `**${previewItem.name}**`,
      getRarityDisplay(previewItem.rarity),
      previewItem.description
    ].join('\n')
  });

  const media = buildEmbedMedia(previewItem.imageUrl);
  embed.setThumbnail(media.source);

  return {
    embed,
    files: media.files
  };
}
