import { EmbedBuilder } from 'discord.js';

import type { LeaderboardView } from '../../modules/leaderboard/leaderboardService.js';
import { getPreferredDisplayName } from '../../utils/player.js';
import { formatInteger, getLeaderboardRankIcon } from './visualTheme.js';

export function buildLeaderboardEmbed(view: LeaderboardView): EmbedBuilder {
  const description =
    view.entries.length > 0
      ? view.entries
          .map((entry, index) => {
            const displayName = getPreferredDisplayName(entry.username, entry.globalName);

            return [
              `${getLeaderboardRankIcon(index)} **${displayName}**`,
              `└ **${formatInteger(entry.score)} pts** • ${formatInteger(entry.uniqueBrainrots)} uniques • ${formatInteger(entry.totalBrainrots)} total`
            ].join('\n');
          })
          .join('\n\n')
      : 'Aucun brainrot réclamé pour le moment sur ce serveur.';

  return new EmbedBuilder()
    .setColor(0xf59e0b)
    .setAuthor({
      name: '🏆 Classement serveur'
    })
    .setTitle(view.entries[0] ? 'Top collectionneurs' : 'Aucun classement disponible')
    .setDescription(description)
    .setFooter({
      text: 'Score = somme des raretés + uniques × 10 + total des brainrots'
    });
}
