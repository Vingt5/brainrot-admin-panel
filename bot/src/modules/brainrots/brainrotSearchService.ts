import type { BrainrotRecord, DiscordUserSnapshot } from '../../core/types.js';
import { PlayerBrainrotRepository } from '../players/playerBrainrotRepository.js';
import { PlayerFavoriteRepository } from '../players/playerFavoriteRepository.js';
import { PlayerRepository } from '../players/playerRepository.js';
import { PlayerWishRepository } from '../players/playerWishRepository.js';
import { BrainrotService } from './brainrotService.js';

export interface BrainrotSearchEntry {
  brainrot: BrainrotRecord;
  quantityOwned: number;
  isOwned: boolean;
  isWished: boolean;
  isFavorite: boolean;
}

export interface BrainrotSearchView {
  user: DiscordUserSnapshot;
  query: string;
  entries: BrainrotSearchEntry[];
}

const DEFAULT_SEARCH_LIMIT = 5;

export class BrainrotSearchService {
  public constructor(
    private readonly brainrotService: BrainrotService,
    private readonly playerRepository: PlayerRepository,
    private readonly playerBrainrotRepository: PlayerBrainrotRepository,
    private readonly playerWishRepository: PlayerWishRepository,
    private readonly playerFavoriteRepository: PlayerFavoriteRepository
  ) {}

  public search(user: DiscordUserSnapshot, query: string, limit = DEFAULT_SEARCH_LIMIT): BrainrotSearchView {
    const player = this.playerRepository.findByDiscordUserId(user.discordUserId);
    const entries = this.brainrotService.search(query, limit).map((brainrot) => {
      const quantityOwned = player
        ? this.playerBrainrotRepository.getOwnedQuantity(player.id, brainrot.databaseId)
        : 0;

      return {
        brainrot,
        quantityOwned,
        isOwned: quantityOwned > 0,
        isWished: player ? this.playerWishRepository.hasWish(player.id, brainrot.databaseId) : false,
        isFavorite: player ? this.playerFavoriteRepository.hasFavorite(player.id, brainrot.databaseId) : false
      };
    });

    return {
      user,
      query,
      entries
    };
  }
}
