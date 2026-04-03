import { EmbedBuilder } from 'discord.js';

import type { CooldownSnapshot } from '../../core/types.js';
import { formatDuration } from '../../utils/time.js';
import { formatDiscordTimestamp } from './visualTheme.js';

export function buildCooldownEmbed(cooldowns: CooldownSnapshot, commandPrefix: string): EmbedBuilder {
  const rollReady = cooldowns.rollRemainingMs <= 0;
  const claimReady = cooldowns.claimRemainingMs <= 0;

  return new EmbedBuilder()
    .setColor(rollReady && claimReady ? 0x16a34a : 0x1d4ed8)
    .setAuthor({
      name: '⏱️ Temps de recharge'
    })
    .setTitle(rollReady && claimReady ? 'Tout est prêt' : 'Timers actifs')
    .setDescription(
      [
        `**Roll ${commandPrefix}r** · ${rollReady ? 'Disponible maintenant' : formatDuration(cooldowns.rollRemainingMs)}`,
        cooldowns.rollReadyAt ? `Prêt ${formatDiscordTimestamp(cooldowns.rollReadyAt, 'R')} · ${formatDiscordTimestamp(cooldowns.rollReadyAt, 't')}` : 'Prêt immédiatement',
        '',
        `**Réclamation** · ${claimReady ? 'Disponible maintenant' : formatDuration(cooldowns.claimRemainingMs)}`,
        cooldowns.claimReadyAt ? `Prête ${formatDiscordTimestamp(cooldowns.claimReadyAt, 'R')} · ${formatDiscordTimestamp(cooldowns.claimReadyAt, 't')}` : 'Prête immédiatement'
      ].join('\n')
    )
    .setFooter({
      text: 'Le claim gagne toujours au premier clic valide dans la fenêtre active.'
    });
}
