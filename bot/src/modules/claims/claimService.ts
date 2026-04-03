import type Database from 'better-sqlite3';

import { CLAIM_COOLDOWN_MS } from '../../config/game.js';
import type { ActiveRollWithBrainrot, DiscordUserSnapshot } from '../../core/types.js';
import { getRemainingMilliseconds, nowIso } from '../../utils/time.js';
import { PlayerBrainrotRepository } from '../players/playerBrainrotRepository.js';
import { PlayerRepository } from '../players/playerRepository.js';
import { PlayerService } from '../players/playerService.js';
import { ActiveRollRepository } from '../rolls/activeRollRepository.js';

export type ClaimAttemptResult =
  | { kind: 'success'; roll: ActiveRollWithBrainrot }
  | { kind: 'guild_not_configured' }
  | { kind: 'wrong_channel'; configuredChannelId: string }
  | { kind: 'not_found' }
  | { kind: 'already_claimed'; claimedByDiscordUserId: string | null }
  | { kind: 'cooldown'; remainingMs: number };

export class ClaimService {
  public constructor(
    private readonly database: Database.Database,
    private readonly playerService: PlayerService,
    private readonly playerRepository: PlayerRepository,
    private readonly playerBrainrotRepository: PlayerBrainrotRepository,
    private readonly activeRollRepository: ActiveRollRepository
  ) {}

  public claimRoll(input: {
    guildDiscordId: string;
    channelId: string;
    rollId: number;
    user: DiscordUserSnapshot;
  }): ClaimAttemptResult {
    const context = this.playerService.ensurePlayerContext(input.user, input.guildDiscordId);

    if (!context.guild.configuredChannelId) {
      return { kind: 'guild_not_configured' };
    }

    if (context.guild.configuredChannelId !== input.channelId) {
      return {
        kind: 'wrong_channel',
        configuredChannelId: context.guild.configuredChannelId
      };
    }

    const runTransaction = this.database.transaction((): ClaimAttemptResult => {
      const timestamp = nowIso();
      const nowMs = Date.parse(timestamp);
      const roll = this.activeRollRepository.findById(input.rollId);

      if (!roll) {
        return { kind: 'not_found' };
      }

      if (roll.channelId !== input.channelId) {
        return {
          kind: 'wrong_channel',
          configuredChannelId: roll.channelId
        };
      }

      if (roll.status === 'claimed') {
        return {
          kind: 'already_claimed',
          claimedByDiscordUserId: roll.claimedByDiscordUserId
        };
      }

      const freshPlayer = this.playerRepository.findById(context.player.id) ?? context.player;
      const remainingMs = getRemainingMilliseconds(freshPlayer.lastClaimAt, CLAIM_COOLDOWN_MS, nowMs);

      if (remainingMs > 0) {
        return {
          kind: 'cooldown',
          remainingMs
        };
      }

      const changes = this.activeRollRepository.claimActiveRoll(roll.id, freshPlayer.id, timestamp, timestamp);

      if (changes === 0) {
        const refreshedRoll = this.activeRollRepository.findById(roll.id);

        if (!refreshedRoll) {
          return { kind: 'not_found' };
        }

        if (refreshedRoll.status === 'claimed') {
          return {
            kind: 'already_claimed',
            claimedByDiscordUserId: refreshedRoll.claimedByDiscordUserId
          };
        }

        return { kind: 'not_found' };
      }

      this.playerBrainrotRepository.incrementOwnership(freshPlayer.id, roll.brainrot.databaseId, timestamp);
      this.playerRepository.updateLastClaimAt(freshPlayer.id, timestamp);

      const claimedRoll = this.activeRollRepository.findById(roll.id);

      if (!claimedRoll) {
        throw new Error(`Impossible de recharger les données du roll réclamé ${roll.id}.`);
      }

      return {
        kind: 'success',
        roll: claimedRoll
      };
    });

    return runTransaction();
  }
}
