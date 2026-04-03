import type { Client, Message } from 'discord.js';

import type { AppContext } from '../../core/appContext.js';
import { parsePrefixCommand } from '../../utils/prefixCommand.js';
import { buildPrefixCommandRegistry } from '../registry/prefixCommandRegistry.js';

const prefixCommandRegistry = buildPrefixCommandRegistry();

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function registerMessageCreateEvent(client: Client, context: AppContext): void {
  client.on('messageCreate', async (message: Message) => {
    if (message.author.bot || !message.inGuild()) {
      return;
    }

    const parsedCommand = parsePrefixCommand(message.content, context.config.commandPrefix);

    if (!parsedCommand) {
      return;
    }

    const handler = prefixCommandRegistry.get(parsedCommand.name);

    if (!handler) {
      await message.reply({
        content: `Commande inconnue : \`${context.config.commandPrefix}${parsedCommand.name}\`. Utilise \`${context.config.commandPrefix}h\` pour voir les commandes disponibles.`
      });
      return;
    }

    try {
      await handler.execute(message, parsedCommand.args, context);
    } catch (error) {
      context.logger.error('Le traitement de la commande préfixée a échoué.', {
        messageId: message.id,
        guildId: message.guildId,
        channelId: message.channelId,
        commandName: parsedCommand.name,
        error: getErrorMessage(error)
      });

      await message.reply({
        content: 'Une erreur interne est survenue pendant le traitement de cette commande.'
      });
    }
  });
}
