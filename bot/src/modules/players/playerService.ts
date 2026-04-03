import type { DiscordUserSnapshot, GuildRecord, PlayerRecord } from '../../core/types.js';
import { nowIso } from '../../utils/time.js';
import { GuildRepository } from '../guilds/guildRepository.js';
import { PlayerGuildRepository } from './playerGuildRepository.js';
import { PlayerRepository } from './playerRepository.js';

export interface PlayerContext {
  player: PlayerRecord;
  guild: GuildRecord;
}

export class PlayerService {
  public constructor(
    private readonly playerRepository: PlayerRepository,
    private readonly guildRepository: GuildRepository,
    private readonly playerGuildRepository: PlayerGuildRepository
  ) {}

  public ensurePlayerContext(user: DiscordUserSnapshot, discordGuildId: string): PlayerContext {
    const timestamp = nowIso();
    const guild = this.guildRepository.ensureGuild(discordGuildId, timestamp);
    const player = this.playerRepository.upsertDiscordUser(user, timestamp);

    this.playerGuildRepository.upsertMembership(player.id, guild.id, timestamp);

    return {
      player,
      guild
    };
  }

  public findByDiscordUserId(discordUserId: string): PlayerRecord | null {
    return this.playerRepository.findByDiscordUserId(discordUserId);
  }
}
