import { INVENTORY_PAGE_SIZE } from '../../config/game.js';
import type { DiscordUserSnapshot, InventoryEntry, InventorySort } from '../../core/types.js';
import { PlayerBrainrotRepository } from '../players/playerBrainrotRepository.js';
import { PlayerRepository } from '../players/playerRepository.js';

export interface InventoryPage {
  user: DiscordUserSnapshot;
  sort: InventorySort;
  favoritesOnly: boolean;
  page: number;
  totalPages: number;
  totalEntries: number;
  items: InventoryEntry[];
}

export class InventoryService {
  public constructor(
    private readonly playerRepository: PlayerRepository,
    private readonly playerBrainrotRepository: PlayerBrainrotRepository
  ) {}

  public getInventory(
    user: DiscordUserSnapshot,
    sort: InventorySort,
    requestedPage: number,
    options?: { favoritesOnly?: boolean }
  ): InventoryPage {
    const player = this.playerRepository.findByDiscordUserId(user.discordUserId);
    const favoritesOnly = options?.favoritesOnly ?? false;

    if (!player) {
      return {
        user,
        sort,
        favoritesOnly,
        page: 1,
        totalPages: 1,
        totalEntries: 0,
        items: []
      };
    }

    const totalEntries = this.playerBrainrotRepository.countOwnedEntriesWithFilter(player.id, favoritesOnly);
    const totalPages = Math.max(1, Math.ceil(totalEntries / INVENTORY_PAGE_SIZE));
    const page = Math.min(Math.max(requestedPage, 1), totalPages);
    const offset = (page - 1) * INVENTORY_PAGE_SIZE;
    const items =
      totalEntries > 0
        ? this.playerBrainrotRepository.getInventoryEntries(
            player.id,
            sort,
            INVENTORY_PAGE_SIZE,
            offset,
            favoritesOnly
          )
        : [];

    return {
      user,
      sort,
      favoritesOnly,
      page,
      totalPages,
      totalEntries,
      items
    };
  }
}
