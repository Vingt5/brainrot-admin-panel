import { Client, GatewayIntentBits } from 'discord.js';

import { createAppContext } from './core/container.js';
import { registerInteractionCreateEvent } from './discord/events/interactionCreateEvent.js';
import { registerMessageCreateEvent } from './discord/events/messageCreateEvent.js';
import { registerReadyEvent } from './discord/events/readyEvent.js';

const context = createAppContext();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

if (!context.config.discordToken) {
  throw new Error('DISCORD_TOKEN est requis pour démarrer le bot.');
}

registerReadyEvent(client, context);
registerInteractionCreateEvent(client, context);
registerMessageCreateEvent(client, context);

const shutdown = async (): Promise<void> => {
  context.logger.info('Arrêt du bot brainrot.');
  context.database.close();
  client.destroy();
  process.exit(0);
};

process.once('SIGINT', () => {
  void shutdown();
});

process.once('SIGTERM', () => {
  void shutdown();
});

await client.login(context.config.discordToken);
