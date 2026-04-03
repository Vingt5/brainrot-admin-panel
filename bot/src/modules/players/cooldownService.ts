import { CLAIM_COOLDOWN_MS, ROLL_COOLDOWN_MS } from '../../config/game.js';
import type { CooldownSnapshot } from '../../core/types.js';
import { getReadyAt, getRemainingMilliseconds } from '../../utils/time.js';
import { PlayerRepository } from './playerRepository.js';

export class CooldownService {
  public constructor(private readonly playerRepository: PlayerRepository) {}

  public getCooldowns(discordUserId: string): CooldownSnapshot {
    const player = this.playerRepository.findByDiscordUserId(discordUserId);
    const nowMs = Date.now();

    if (!player) {
      return {
        rollRemainingMs: 0,
        claimRemainingMs: 0,
        rollReadyAt: null,
        claimReadyAt: null
      };
    }

    return {
      rollRemainingMs: getRemainingMilliseconds(player.lastRollAt, ROLL_COOLDOWN_MS, nowMs),
      claimRemainingMs: getRemainingMilliseconds(player.lastClaimAt, CLAIM_COOLDOWN_MS, nowMs),
      rollReadyAt: ROLL_COOLDOWN_MS > 0 ? getReadyAt(player.lastRollAt, ROLL_COOLDOWN_MS) : null,
      claimReadyAt: CLAIM_COOLDOWN_MS > 0 ? getReadyAt(player.lastClaimAt, CLAIM_COOLDOWN_MS) : null
    };
  }
}
