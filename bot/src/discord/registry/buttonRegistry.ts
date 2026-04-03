import { claimButton } from '../buttons/claimButton.js';
import { inventoryPaginationButton } from '../buttons/inventoryPaginationButton.js';
import type { ButtonHandler } from './types.js';

export const buttonHandlers: readonly ButtonHandler[] = [claimButton, inventoryPaginationButton];

export function resolveButtonHandler(customId: string): ButtonHandler | null {
  return buttonHandlers.find((handler) => customId.startsWith(handler.customIdPrefix)) ?? null;
}
