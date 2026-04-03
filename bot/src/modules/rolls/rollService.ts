import type Database from 'better-sqlite3';

import { ROLL_COOLDOWN_MS } from '../../config/game.js';
import type { ActiveRollWithBrainrot, DiscordUserSnapshot } from '../../core/types.js';
import { getRemainingMilliseconds, nowIso } from '../../utils/time.js';
import { BrainrotService } from '../brainrots/brainrotService.js';
import { PlayerRepository } from '../players/playerRepository.js';
import { PlayerService } from '../players/playerService.js';
import { ActiveRollRepository } from './activeRollRepository.js';

const NON_EXPIRING_ROLL_EXPIRES_AT = '9999-12-31T23:59:59.999Z';

export type RollAttemptResult =
  | { kind: 'success'; roll: ActiveRollWithBrainrot }
  | { kind: 'guild_not_configured' }
  | { kind: 'wrong_channel'; configuredChannelId: string }
  | { kind: 'cooldown'; remainingMs: number }
  | { kind: 'no_brainrots' };

export class RollService {
  public constructor(
    private readonly database: Database.Database,
    private readonly playerService: PlayerService,
    private readonly playerRepository: PlayerRepository,
    private readonly brainrotService: BrainrotService,
    private readonly activeRollRepository: ActiveRollRepository
  ) {}

  public createRoll(input: {
    guildDiscordId: string;
    channelId: string;
    user: DiscordUserSnapshot;
  }): RollAttemptResult {
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

    const runTransaction = this.database.transaction((): RollAttemptResult => {
      const timestamp = nowIso();
      const nowMs = Date.parse(timestamp);

      const freshPlayer = this.playerRepository.findById(context.player.id) ?? context.player;
      const remainingMs = getRemainingMilliseconds(freshPlayer.lastRollAt, ROLL_COOLDOWN_MS, nowMs);

      if (remainingMs > 0) {
        return {
          kind: 'cooldown',
          remainingMs
        };
      }

      const brainrot = this.brainrotService.getRandomBrainrot();

      if (!brainrot) {
        return { kind: 'no_brainrots' };
      }

      try {
        const createdRoll = this.activeRollRepository.createActiveRoll({
          guildId: context.guild.id,
          channelId: input.channelId,
          brainrotId: brainrot.databaseId,
          rolledByPlayerId: freshPlayer.id,
          createdAt: timestamp,
          expiresAt: NON_EXPIRING_ROLL_EXPIRES_AT
        });

        this.playerRepository.updateLastRollAt(freshPlayer.id, timestamp);

        const hydratedRoll = this.activeRollRepository.findById(createdRoll.id);

        if (!hydratedRoll) {
          throw new Error(`Impossible de recharger les données du roll ${createdRoll.id}.`);
        }

        return {
          kind: 'success',
          roll: hydratedRoll
        };
      } catch (error) {
        throw error;
      }
    });

    return runTransaction();
  }

  public attachMessageId(rollId: number, messageId: string): void {
    this.activeRollRepository.updateMessageId(rollId, messageId, nowIso());
  }

  public cancelUnpublishedRoll(rollId: number): void {
    this.activeRollRepository.deleteByIdIfActive(rollId);
  }
}
