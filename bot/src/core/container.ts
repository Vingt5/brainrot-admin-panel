import { loadEnv } from '../config/env.js';
import { Logger } from './logger.js';
import type { AppContext } from './appContext.js';
import { createDatabase } from '../database/connection.js';
import { runSchema } from '../database/runSchema.js';
import { BrainrotRepository } from '../modules/brainrots/brainrotRepository.js';
import { BrainrotSearchService } from '../modules/brainrots/brainrotSearchService.js';
import { BrainrotRankingService } from '../modules/brainrots/brainrotRankingService.js';
import { BrainrotService } from '../modules/brainrots/brainrotService.js';
import { ClaimService } from '../modules/claims/claimService.js';
import { GuildRepository } from '../modules/guilds/guildRepository.js';
import { GuildService } from '../modules/guilds/guildService.js';
import { SetupService } from '../modules/guilds/setupService.js';
import { InventoryService } from '../modules/inventory/inventoryService.js';
import { LeaderboardRepository } from '../modules/leaderboard/leaderboardRepository.js';
import { LeaderboardService } from '../modules/leaderboard/leaderboardService.js';
import { CooldownService } from '../modules/players/cooldownService.js';
import { FavoriteService } from '../modules/players/favoriteService.js';
import { PlayerFavoriteRepository } from '../modules/players/playerFavoriteRepository.js';
import { PlayerBrainrotRepository } from '../modules/players/playerBrainrotRepository.js';
import { PlayerGuildRepository } from '../modules/players/playerGuildRepository.js';
import { PlayerRepository } from '../modules/players/playerRepository.js';
import { PlayerService } from '../modules/players/playerService.js';
import { ProfileService } from '../modules/players/profileService.js';
import { PlayerWishRepository } from '../modules/players/playerWishRepository.js';
import { WishService } from '../modules/players/wishService.js';
import { ActiveRollRepository } from '../modules/rolls/activeRollRepository.js';
import { RollService } from '../modules/rolls/rollService.js';

export function createAppContext(): AppContext {
  const config = loadEnv();
  const logger = new Logger(config.logLevel);
  const database = createDatabase(config.databasePath);

  runSchema(database);

  const brainrotRepository = new BrainrotRepository(database);
  const guildRepository = new GuildRepository(database);
  const leaderboardRepository = new LeaderboardRepository(database);
  const playerFavoriteRepository = new PlayerFavoriteRepository(database);
  const playerBrainrotRepository = new PlayerBrainrotRepository(database);
  const playerGuildRepository = new PlayerGuildRepository(database);
  const playerRepository = new PlayerRepository(database);
  const playerWishRepository = new PlayerWishRepository(database);
  const activeRollRepository = new ActiveRollRepository(database);

  const brainrotService = new BrainrotService(brainrotRepository);
  const brainrotSearchService = new BrainrotSearchService(
    brainrotService,
    playerRepository,
    playerBrainrotRepository,
    playerWishRepository,
    playerFavoriteRepository
  );
  const brainrotRankingService = new BrainrotRankingService(brainrotRepository);
  const guildService = new GuildService(guildRepository);
  const setupService = new SetupService(guildRepository);
  const playerService = new PlayerService(playerRepository, guildRepository, playerGuildRepository);
  const wishService = new WishService(playerService, guildRepository, brainrotService, playerWishRepository);
  const favoriteService = new FavoriteService(
    playerService,
    brainrotService,
    playerBrainrotRepository,
    playerFavoriteRepository
  );
  const rollService = new RollService(
    database,
    playerService,
    playerRepository,
    brainrotService,
    activeRollRepository
  );
  const claimService = new ClaimService(
    database,
    playerService,
    playerRepository,
    playerBrainrotRepository,
    activeRollRepository
  );
  const profileService = new ProfileService(
    playerRepository,
    playerBrainrotRepository,
    playerWishRepository,
    playerFavoriteRepository
  );
  const inventoryService = new InventoryService(playerRepository, playerBrainrotRepository);
  const leaderboardService = new LeaderboardService(guildRepository, leaderboardRepository);
  const cooldownService = new CooldownService(playerRepository);

  return {
    config,
    logger,
    database,
    repositories: {
      brainrotRepository,
      guildRepository,
      leaderboardRepository,
      playerFavoriteRepository,
      playerBrainrotRepository,
      playerGuildRepository,
      playerRepository,
      playerWishRepository,
      activeRollRepository
    },
    services: {
      brainrotRankingService,
      brainrotSearchService,
      brainrotService,
      claimService,
      cooldownService,
      favoriteService,
      guildService,
      inventoryService,
      leaderboardService,
      playerService,
      profileService,
      rollService,
      setupService,
      wishService
    }
  };
}
