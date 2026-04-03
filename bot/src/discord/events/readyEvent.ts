import { ActivityType, type Client } from 'discord.js';

import type { AppContext } from '../../core/appContext.js';

export function registerReadyEvent(client: Client, context: AppContext): void {
  client.once('clientReady', (readyClient) => {
    readyClient.user.setPresence({
      activities: [
        {
          name: 'Custom Status',
          state: 'collectionne les brainrots',
          type: ActivityType.Custom
        }
      ],
      status: 'online'
    });

    const brainrotCount = context.services.brainrotService.countBrainrots();

    context.logger.info('Le bot Brainrot est pret.', {
      userTag: readyClient.user.tag,
      brainrotCount
    });

    if (brainrotCount === 0) {
      context.logger.warn('Aucun brainrot n est seede. Lance `npm run db:seed` avant d utiliser /roll.');
    }
  });
}
