import type { DiscordUserSnapshot, PlayerProfileStats } from '../../core/types.js';
import { PlayerFavoriteRepository } from './playerFavoriteRepository.js';
import { PlayerBrainrotRepository } from './playerBrainrotRepository.js';
import { PlayerRepository } from './playerRepository.js';
import { PlayerWishRepository } from './playerWishRepository.js';

export interface ProfileView {
  user: DiscordUserSnapshot;
  stats: PlayerProfileStats;
}

export class ProfileService {
  public constructor(
    private readonly playerRepository: PlayerRepository,
    private readonly playerBrainrotRepository: PlayerBrainrotRepository,
    private readonly playerWishRepository: PlayerWishRepository,
    private readonly playerFavoriteRepository: PlayerFavoriteRepository
  ) {}

  public getProfile(user: DiscordUserSnapshot): ProfileView {
    const player = this.playerRepository.findByDiscordUserId(user.discordUserId);

    if (!player) {
      const emptyStats: PlayerProfileStats = {
        totalBrainrots: 0,
        uniqueBrainrots: 0,
        rarityScore: 0,
        score: 0,
        wishCount: 0,
        favoriteCount: 0,
        highestOwnedRarity: null,
        lastObtainedBrainrot: null,
        lastObtainedAt: null
      };

      return {
        user,
        stats: emptyStats
      };
    }

    const stats = this.playerBrainrotRepository.getProfileStats(player.id);

    return {
      user,
      stats: {
        ...stats,
        wishCount: this.playerWishRepository.countForPlayer(player.id),
        favoriteCount: this.playerFavoriteRepository.countForPlayer(player.id)
      }
    };
  }
}
