import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';

import { INVENTORY_PAGE_SIZE, inventorySortLabelMap } from '../../config/game.js';
import type { InventorySort } from '../../core/types.js';
import type { InventoryPage } from '../../modules/inventory/inventoryService.js';
import { getPreferredDisplayName } from '../../utils/player.js';
import { buildEmbedMedia } from './embedMediaBuilder.js';
import {
  buildProgressBar,
  formatCompletion,
  formatDiscordTimestamp,
  formatInteger,
  getRarityDisplay,
  rarityVisualThemeMap
} from './visualTheme.js';

export interface BuiltInventoryMessage {
  readonly embed: EmbedBuilder;
  readonly files: AttachmentBuilder[];
}

function buildInventoryLine(index: number, item: InventoryPage['items'][number]): string {
  const favoriteMarker = item.isFavorite ? '⭐ ' : '';

  return [
    `**${index}. ${favoriteMarker}${item.brainrot.name}**`,
    `└ ${getRarityDisplay(item.brainrot.rarity)} • x${formatInteger(item.quantity)} • ${formatDiscordTimestamp(item.lastObtainedAt, 'R')}`
  ].join('\n');
}

export function buildInventoryMessage(page: InventoryPage, catalogSize: number): BuiltInventoryMessage {
  const displayName = getPreferredDisplayName(page.user.username, page.user.globalName);
  const previewItem = page.items[0];
  const previewRarity = previewItem?.brainrot.rarity ?? 'common';
  const description =
    page.items.length > 0
      ? page.items
          .map((item, index) =>
            buildInventoryLine((page.page - 1) * INVENTORY_PAGE_SIZE + index + 1, item)
          )
          .join('\n\n')
      : page.favoritesOnly
        ? 'Aucun brainrot favori pour le moment.'
        : 'Aucun brainrot collecté pour le moment.';

  const embed = new EmbedBuilder()
    .setColor(rarityVisualThemeMap[previewRarity].color)
    .setAuthor({
      name: `🗂️ Inventaire · ${displayName}`
    })
    .setTitle(
      page.totalEntries > 0
        ? page.favoritesOnly
          ? 'Vitrine des favoris'
          : 'Collection active'
        : page.favoritesOnly
          ? 'Aucun favori'
          : 'Collection vide'
    )
    .setDescription(
      [
        `**${page.favoritesOnly ? 'Progression favoris' : 'Progression'}**`,
        `${buildProgressBar(page.totalEntries, catalogSize, 12)} ${formatInteger(page.totalEntries)}/${formatInteger(catalogSize)} · ${formatCompletion(page.totalEntries, catalogSize)}`,
        '',
        description
      ].join('\n')
    )
    .addFields(
      {
        name: 'Tri',
        value: inventorySortLabelMap[page.sort],
        inline: true
      },
      {
        name: 'Filtre',
        value: page.favoritesOnly ? 'Favoris uniquement' : 'Aucun',
        inline: true
      },
      {
        name: 'Page',
        value: `${page.page}/${page.totalPages}`,
        inline: true
      },
      {
        name: 'Entrées uniques',
        value: formatInteger(page.totalEntries),
        inline: true
      }
    )
    .setFooter({
      text: `Aperçu de ${Math.min(page.items.length, INVENTORY_PAGE_SIZE)} entrées sur ${formatInteger(page.totalEntries)}`
    });

  if (!previewItem) {
    return {
      embed,
      files: []
    };
  }

  embed.addFields({
    name: 'Carte mise en avant',
    value: [
      `**${previewItem.isFavorite ? '⭐ ' : ''}${previewItem.brainrot.name}**`,
      `${getRarityDisplay(previewItem.brainrot.rarity)} • x${formatInteger(previewItem.quantity)}`,
      `Premier drop ${formatDiscordTimestamp(previewItem.firstObtainedAt, 'R')}`
    ].join('\n')
  });

  const media = buildEmbedMedia(previewItem.brainrot.imageUrl);
  embed.setThumbnail(media.source);

  return {
    embed,
    files: media.files
  };
}

export function buildInventoryPaginationRow(
  requesterId: string,
  targetUserId: string,
  sort: InventorySort,
  page: number,
  totalPages: number,
  favoritesOnly: boolean
): ActionRowBuilder<ButtonBuilder> {
  const favoriteFlag = favoritesOnly ? '1' : '0';

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`inventory:${requesterId}:${targetUserId}:${sort}:${page - 1}:${favoriteFlag}`)
      .setLabel('Précédent')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(`inventory-status:${requesterId}:${targetUserId}:${sort}:${page}:${favoriteFlag}`)
      .setLabel(`${page}/${totalPages}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`inventory:${requesterId}:${targetUserId}:${sort}:${page + 1}:${favoriteFlag}`)
      .setLabel('Suivant')
      .setEmoji('▶️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages)
  );
}
