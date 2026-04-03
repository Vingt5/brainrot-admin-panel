import type Database from 'better-sqlite3';

import type { AppEnv } from '../config/env.js';
import type { Logger } from './logger.js';
import type { BrainrotRepository } from '../modules/brainrots/brainrotRepository.js';
import type { BrainrotSearchService } from '../modules/brainrots/brainrotSearchService.js';
import type { GuildRepository } from '../modules/guilds/guildRepository.js';
import type { LeaderboardRepository } from '../modules/leaderboard/leaderboardRepository.js';
import type { PlayerFavoriteRepository } from '../modules/players/playerFavoriteRepository.js';
import type { PlayerBrainrotRepository } from '../modules/players/playerBrainrotRepository.js';
import type { PlayerGuildRepository } from '../modules/players/playerGuildRepository.js';
import type { PlayerRepository } from '../modules/players/playerRepository.js';
import type { PlayerWishRepository } from '../modules/players/playerWishRepository.js';
import type { ActiveRollRepository } from '../modules/rolls/activeRollRepository.js';
import type { BrainrotService } from '../modules/brainrots/brainrotService.js';
import type { BrainrotRankingService } from '../modules/brainrots/brainrotRankingService.js';
import type { ClaimService } from '../modules/claims/claimService.js';
import type { FavoriteService } from '../modules/players/favoriteService.js';
import type { GuildService } from '../modules/guilds/guildService.js';
import type { SetupService } from '../modules/guilds/setupService.js';
import type { InventoryService } from '../modules/inventory/inventoryService.js';
import type { LeaderboardService } from '../modules/leaderboard/leaderboardService.js';
import type { CooldownService } from '../modules/players/cooldownService.js';
import type { PlayerService } from '../modules/players/playerService.js';
import type { ProfileService } from '../modules/players/profileService.js';
import type { WishService } from '../modules/players/wishService.js';
import type { RollService } from '../modules/rolls/rollService.js';

export interface AppContext {
  config: AppEnv;
  logger: Logger;
  database: Database.Database;
  repositories: {
    brainrotRepository: BrainrotRepository;
    guildRepository: GuildRepository;
    leaderboardRepository: LeaderboardRepository;
    playerFavoriteRepository: PlayerFavoriteRepository;
    playerBrainrotRepository: PlayerBrainrotRepository;
    playerGuildRepository: PlayerGuildRepository;
    playerRepository: PlayerRepository;
    playerWishRepository: PlayerWishRepository;
    activeRollRepository: ActiveRollRepository;
  };
  services: {
    brainrotRankingService: BrainrotRankingService;
    brainrotSearchService: BrainrotSearchService;
    brainrotService: BrainrotService;
    claimService: ClaimService;
    cooldownService: CooldownService;
    favoriteService: FavoriteService;
    guildService: GuildService;
    inventoryService: InventoryService;
    leaderboardService: LeaderboardService;
    playerService: PlayerService;
    profileService: ProfileService;
    rollService: RollService;
    setupService: SetupService;
    wishService: WishService;
  };
}
