import type { GuildRecord } from '../../core/types.js';
import { nowIso } from '../../utils/time.js';
import { GuildRepository } from './guildRepository.js';

export class GuildService {
  public constructor(private readonly guildRepository: GuildRepository) {}

  public ensureGuild(discordGuildId: string): GuildRecord {
    return this.guildRepository.ensureGuild(discordGuildId, nowIso());
  }

  public getGuild(discordGuildId: string): GuildRecord | null {
    return this.guildRepository.findByDiscordGuildId(discordGuildId);
  }
}
