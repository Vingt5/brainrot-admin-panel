import type { GuildRecord } from '../../core/types.js';
import { nowIso } from '../../utils/time.js';
import { GuildRepository } from './guildRepository.js';

export class SetupService {
  public constructor(private readonly guildRepository: GuildRepository) {}

  public configureGuildChannel(discordGuildId: string, channelId: string): GuildRecord {
    return this.guildRepository.configureChannel(discordGuildId, channelId, nowIso());
  }

  public resetGuildChannel(discordGuildId: string): GuildRecord {
    return this.guildRepository.clearConfiguredChannel(discordGuildId, nowIso());
  }

  public getGuildSetup(discordGuildId: string): GuildRecord | null {
    return this.guildRepository.findByDiscordGuildId(discordGuildId);
  }
}
