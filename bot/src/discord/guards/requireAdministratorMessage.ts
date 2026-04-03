import { PermissionFlagsBits, type Message } from 'discord.js';

import type { AppContext } from '../../core/appContext.js';

export async function requireAdministratorMessage(
  message: Message<true>,
  context: AppContext
): Promise<boolean> {
  if (message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  await message.reply({
    content: `Seuls les administrateurs peuvent utiliser \`${context.config.commandPrefix}setup\` ou \`/setup\`.`
  });

  return false;
}
