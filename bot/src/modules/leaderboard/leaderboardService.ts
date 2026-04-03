import { LEADERBOARD_LIMIT } from '../../config/game.js';
import type { LeaderboardEntry } from '../../core/types.js';
import { GuildRepository } from '../guilds/guildRepository.js';
import { LeaderboardRepository } from './leaderboardRepository.js';

export interface LeaderboardView {
  guildConfigured: boolean;
  entries: LeaderboardEntry[];
}

export class LeaderboardService {
  public constructor(
    private readonly guildRepository: GuildRepository,
    private readonly leaderboardRepository: LeaderboardRepository
  ) {}

  public getLeaderboard(discordGuildId: string): LeaderboardView {
    const guild = this.guildRepository.findByDiscordGuildId(discordGuildId);

    if (!guild) {
      return {
        guildConfigured: false,
        entries: []
      };
    }

    return {
      guildConfigured: Boolean(guild.configuredChannelId),
      entries: this.leaderboardRepository.getTopForGuild(guild.id, LEADERBOARD_LIMIT)
    };
  }
}
