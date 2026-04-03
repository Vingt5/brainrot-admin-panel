import type { BrainrotRecord, DiscordUserSnapshot } from '../../core/types.js';
import { BrainrotService } from '../brainrots/brainrotService.js';
import { PlayerService } from './playerService.js';
import { PlayerBrainrotRepository } from './playerBrainrotRepository.js';
import { PlayerFavoriteRepository } from './playerFavoriteRepository.js';
import { nowIso } from '../../utils/time.js';

export type FavoriteMutationResult =
  | { kind: 'success'; brainrot: BrainrotRecord; totalFavorites: number }
  | { kind: 'already_favorite'; brainrot: BrainrotRecord; totalFavorites: number }
  | { kind: 'not_favorite'; brainrot: BrainrotRecord; totalFavorites: number }
  | { kind: 'not_owned'; brainrot: BrainrotRecord; totalFavorites: number }
  | { kind: 'not_found'; query: string }
  | { kind: 'ambiguous'; query: string; candidates: BrainrotRecord[] };

export class FavoriteService {
  public constructor(
    private readonly playerService: PlayerService,
    private readonly brainrotService: BrainrotService,
    private readonly playerBrainrotRepository: PlayerBrainrotRepository,
    private readonly playerFavoriteRepository: PlayerFavoriteRepository
  ) {}

  public addFavorite(input: {
    guildDiscordId: string;
    user: DiscordUserSnapshot;
    query: string;
  }): FavoriteMutationResult {
    const context = this.playerService.ensurePlayerContext(input.user, input.guildDiscordId);
    const resolution = this.brainrotService.resolveExact(input.query);

    if (resolution.kind !== 'success') {
      return resolution;
    }

    const totalFavorites = this.playerFavoriteRepository.countForPlayer(context.player.id);

    if (!this.playerBrainrotRepository.ownsBrainrot(context.player.id, resolution.brainrot.databaseId)) {
      return {
        kind: 'not_owned',
        brainrot: resolution.brainrot,
        totalFavorites
      };
    }

    if (this.playerFavoriteRepository.hasFavorite(context.player.id, resolution.brainrot.databaseId)) {
      return {
        kind: 'already_favorite',
        brainrot: resolution.brainrot,
        totalFavorites
      };
    }

    this.playerFavoriteRepository.addFavorite(context.player.id, resolution.brainrot.databaseId, nowIso());

    return {
      kind: 'success',
      brainrot: resolution.brainrot,
      totalFavorites: totalFavorites + 1
    };
  }

  public removeFavorite(input: {
    guildDiscordId: string;
    user: DiscordUserSnapshot;
    query: string;
  }): FavoriteMutationResult {
    const context = this.playerService.ensurePlayerContext(input.user, input.guildDiscordId);
    const resolution = this.brainrotService.resolveExact(input.query);

    if (resolution.kind !== 'success') {
      return resolution;
    }

    const removed = this.playerFavoriteRepository.removeFavorite(context.player.id, resolution.brainrot.databaseId);
    const totalFavorites = this.playerFavoriteRepository.countForPlayer(context.player.id);

    if (!removed) {
      return {
        kind: 'not_favorite',
        brainrot: resolution.brainrot,
        totalFavorites
      };
    }

    return {
      kind: 'success',
      brainrot: resolution.brainrot,
      totalFavorites
    };
  }
}
