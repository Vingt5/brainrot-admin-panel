import type { Client, Interaction } from 'discord.js';

import type { AppContext } from '../../core/appContext.js';
import { replyEphemeral } from '../../utils/discord.js';
import { requireGuildInteraction } from '../guards/requireGuildInteraction.js';
import { resolveButtonHandler } from '../registry/buttonRegistry.js';
import { buildCommandRegistry } from '../registry/commandRegistry.js';

const commandRegistry = buildCommandRegistry();

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function registerInteractionCreateEvent(client: Client, context: AppContext): void {
  client.on('interactionCreate', async (interaction: Interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        if (!(await requireGuildInteraction(interaction))) {
          return;
        }

        const handler = commandRegistry.get(interaction.commandName);

        if (!handler) {
          await replyEphemeral(interaction, {
            content: `Commande inconnue : ${interaction.commandName}`
          });
          return;
        }

        await handler.execute(interaction, context);
        return;
      }

      if (interaction.isButton()) {
        if (!(await requireGuildInteraction(interaction))) {
          return;
        }

        const handler = resolveButtonHandler(interaction.customId);

        if (!handler) {
          await replyEphemeral(interaction, {
            content: 'Interaction de bouton inconnue.'
          });
          return;
        }

        await handler.execute(interaction, context);
      }
    } catch (error) {
      context.logger.error('Le traitement de l’interaction a échoué.', {
        interactionId: interaction.id,
        interactionType: interaction.type,
        error: getErrorMessage(error)
      });

      if (interaction.isChatInputCommand() || interaction.isButton()) {
        await replyEphemeral(interaction, {
          content: 'Une erreur interne est survenue pendant le traitement de cette interaction.'
        });
      }
    }
  });
}
