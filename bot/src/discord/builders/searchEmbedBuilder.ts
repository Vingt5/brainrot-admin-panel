import { AttachmentBuilder, EmbedBuilder } from 'discord.js';

import type { BrainrotSearchView } from '../../modules/brainrots/brainrotSearchService.js';
import { getPreferredDisplayName } from '../../utils/player.js';
import { buildEmbedMedia } from './embedMediaBuilder.js';
import { formatInteger, getRarityDisplay, rarityVisualThemeMap, sourceStatusIconMap, sourceStatusLabelMap } from './visualTheme.js';

export interface BuiltSearchMessage {
  readonly embed: EmbedBuilder;
  readonly files: AttachmentBuilder[];
}

function buildStateLine(entry: BrainrotSearchView['entries'][number]): string {
  const possessionLabel = entry.isOwned ? `Oui (x${formatInteger(entry.quantityOwned)})` : 'Non';
  const wishLabel = entry.isWished ? 'Oui' : 'Non';
  const favoriteLabel = entry.isFavorite ? 'Oui' : 'Non';

  return `Possédé: **${possessionLabel}** • Wish: **${wishLabel}** • Favori: **${favoriteLabel}**`;
}

function buildEntryLine(index: number, entry: BrainrotSearchView['entries'][number]): string {
  return [
    `${index}. **${entry.brainrot.name}**`,
    `└ ${getRarityDisplay(entry.brainrot.rarity)} • ${buildStateLine(entry)}`
  ].join('\n');
}

export function buildSearchMessage(view: BrainrotSearchView): BuiltSearchMessage {
  const displayName = getPreferredDisplayName(view.user.username, view.user.globalName);
  const leadEntry = view.entries[0];
  const accentRarity = leadEntry?.brainrot.rarity ?? 'common';
  const description =
    view.entries.length > 0
      ? view.entries.map((entry, index) => buildEntryLine(index + 1, entry)).join('\n\n')
      : `Aucun brainrot trouvé pour **${view.query}**.`;

  const embed = new EmbedBuilder()
    .setColor(rarityVisualThemeMap[accentRarity].color)
    .setAuthor({
      name: `🔎 Recherche collector · ${displayName}`
    })
    .setTitle(view.entries.length > 0 ? `Résultats pour "${view.query}"` : 'Aucun résultat')
    .setDescription(description);

  if (!leadEntry) {
    return {
      embed,
      files: []
    };
  }

  const aliasLabel = leadEntry.brainrot.aliases.length > 0 ? leadEntry.brainrot.aliases.join(', ') : 'Aucun alias';

  embed.addFields({
    name: 'Focus',
    value: [
      `**${leadEntry.brainrot.name}**`,
      `${getRarityDisplay(leadEntry.brainrot.rarity)} • ${sourceStatusIconMap[leadEntry.brainrot.sourceStatus]} ${sourceStatusLabelMap[leadEntry.brainrot.sourceStatus]}`,
      `Aliases: ${aliasLabel}`,
      buildStateLine(leadEntry),
      leadEntry.brainrot.description
    ].join('\n')
  });

  const media = buildEmbedMedia(leadEntry.brainrot.imageUrl);
  embed.setThumbnail(media.source);

  return {
    embed,
    files: media.files
  };
}
