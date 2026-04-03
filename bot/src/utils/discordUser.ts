import type { User } from 'discord.js';

import type { DiscordUserSnapshot } from '../core/types.js';

export function toDiscordUserSnapshot(user: Pick<User, 'id' | 'username' | 'globalName'>): DiscordUserSnapshot {
  return {
    discordUserId: user.id,
    username: user.username,
    globalName: user.globalName
  };
}
