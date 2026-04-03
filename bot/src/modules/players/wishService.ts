import { WISHLIST_MAX_ITEMS, WISH_PING_MAX_USERS } from '../../config/game.js';
import type { BrainrotRecord, DiscordUserSnapshot, WishRollHighlight } from '../../core/types.js';
import { BrainrotService } from '../brainrots/brainrotService.js';
import { GuildRepository } from '../guilds/guildRepository.js';
import { PlayerWishRepository } from './playerWishRepository.js';
import { PlayerService } from './playerService.js';
import { nowIso } from '../../utils/time.js';

export interface WishListView {
  user: DiscordUserSnapshot;
  entries: BrainrotRecord[];
  totalEntries: number;
  limit: number;
}

export type WishMutationResult =
  | { kind: 'success'; brainrot: BrainrotRecord; totalWishes: number }
  | { kind: 'duplicate'; brainrot: BrainrotRecord; totalWishes: number }
  | { kind: 'not_wished'; brainrot: BrainrotRecord; totalWishes: number }
  | { kind: 'limit_reached'; limit: number; totalWishes: number }
  | { kind: 'not_found'; query: string }
  | { kind: 'ambiguous'; query: string; candidates: BrainrotRecord[] };

export class WishService {
  public constructor(
    private readonly playerService: PlayerService,
    private readonly guildRepository: GuildRepository,
    private readonly brainrotService: BrainrotService,
    private readonly playerWishRepository: PlayerWishRepository
  ) {}

  public addWish(input: {
    guildDiscordId: string;
    user: DiscordUserSnapshot;
    query: string;
  }): WishMutationResult {
    const context = this.playerService.ensurePlayerContext(input.user, input.guildDiscordId);
    const resolution = this.brainrotService.resolveExact(input.query);

    if (resolution.kind !== 'success') {
      return resolution;
    }

    const totalWishes = this.playerWishRepository.countForPlayer(context.player.id);

    if (this.playerWishRepository.hasWish(context.player.id, resolution.brainrot.databaseId)) {
      return {
        kind: 'duplicate',
        brainrot: resolution.brainrot,
        totalWishes
      };
    }

    if (totalWishes >= WISHLIST_MAX_ITEMS) {
      return {
        kind: 'limit_reached',
        limit: WISHLIST_MAX_ITEMS,
        totalWishes
      };
    }

    this.playerWishRepository.addWish(context.player.id, resolution.brainrot.databaseId, nowIso());

    return {
      kind: 'success',
      brainrot: resolution.brainrot,
      totalWishes: totalWishes + 1
    };
  }

  public removeWish(input: {
    guildDiscordId: string;
    user: DiscordUserSnapshot;
    query: string;
  }): WishMutationResult {
    const context = this.playerService.ensurePlayerContext(input.user, input.guildDiscordId);
    const resolution = this.brainrotService.resolveExact(input.query);

    if (resolution.kind !== 'success') {
      return resolution;
    }

    const removed = this.playerWishRepository.removeWish(context.player.id, resolution.brainrot.databaseId);
    const totalWishes = this.playerWishRepository.countForPlayer(context.player.id);

    if (!removed) {
      return {
        kind: 'not_wished',
        brainrot: resolution.brainrot,
        totalWishes
      };
    }

    return {
      kind: 'success',
      brainrot: resolution.brainrot,
      totalWishes
    };
  }

  public listWishes(input: { guildDiscordId: string; user: DiscordUserSnapshot }): WishListView {
    const context = this.playerService.ensurePlayerContext(input.user, input.guildDiscordId);
    const entries = this.playerWishRepository.getWishEntries(context.player.id);

    return {
      user: input.user,
      entries,
      totalEntries: entries.length,
      limit: WISHLIST_MAX_ITEMS
    };
  }

  public getRollHighlight(guildDiscordId: string, brainrotId: number): WishRollHighlight {
    const guild = this.guildRepository.findByDiscordGuildId(guildDiscordId);

    if (!guild) {
      return {
        totalWishers: 0,
        mentionedDiscordUserIds: [],
        mentionText: null
      };
    }

    const wishers = this.playerWishRepository.getWishersForGuildAndBrainrot(guild.id, brainrotId);
    const mentionedDiscordUserIds = wishers
      .slice(0, WISH_PING_MAX_USERS)
      .map((player) => player.discordUserId);
    const overflowCount = wishers.length - mentionedDiscordUserIds.length;
    const mentionSegments = mentionedDiscordUserIds.map((discordUserId) => `<@${discordUserId}>`);

    if (overflowCount > 0) {
      mentionSegments.push(`+${overflowCount}`);
    }

    return {
      totalWishers: wishers.length,
      mentionedDiscordUserIds,
      mentionText: mentionSegments.length > 0 ? `💫 Souhait détecté : ${mentionSegments.join(' ')}` : null
    };
  }
}
