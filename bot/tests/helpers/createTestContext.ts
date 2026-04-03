import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { DiscordUserSnapshot, Brainrot } from '../../src/core/types.js';
import { createDatabase } from '../../src/database/connection.js';
import { runSchema } from '../../src/database/runSchema.js';
import { BrainrotRepository } from '../../src/modules/brainrots/brainrotRepository.js';
import { BrainrotSearchService } from '../../src/modules/brainrots/brainrotSearchService.js';
import { BrainrotRankingService } from '../../src/modules/brainrots/brainrotRankingService.js';
import { BrainrotService } from '../../src/modules/brainrots/brainrotService.js';
import { ClaimService } from '../../src/modules/claims/claimService.js';
import { GuildRepository } from '../../src/modules/guilds/guildRepository.js';
import { GuildService } from '../../src/modules/guilds/guildService.js';
import { SetupService } from '../../src/modules/guilds/setupService.js';
import { InventoryService } from '../../src/modules/inventory/inventoryService.js';
import { LeaderboardRepository } from '../../src/modules/leaderboard/leaderboardRepository.js';
import { LeaderboardService } from '../../src/modules/leaderboard/leaderboardService.js';
import { CooldownService } from '../../src/modules/players/cooldownService.js';
import { FavoriteService } from '../../src/modules/players/favoriteService.js';
import { PlayerFavoriteRepository } from '../../src/modules/players/playerFavoriteRepository.js';
import { PlayerBrainrotRepository } from '../../src/modules/players/playerBrainrotRepository.js';
import { PlayerGuildRepository } from '../../src/modules/players/playerGuildRepository.js';
import { PlayerRepository } from '../../src/modules/players/playerRepository.js';
import { PlayerService } from '../../src/modules/players/playerService.js';
import { ProfileService } from '../../src/modules/players/profileService.js';
import { PlayerWishRepository } from '../../src/modules/players/playerWishRepository.js';
import { WishService } from '../../src/modules/players/wishService.js';
import { ActiveRollRepository } from '../../src/modules/rolls/activeRollRepository.js';
import { RollService } from '../../src/modules/rolls/rollService.js';

export interface TestContext {
  tempDirectory: string;
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
  close(): void;
}

export function createUserSnapshot(discordUserId: string, username: string): DiscordUserSnapshot {
  return {
    discordUserId,
    username,
    globalName: null
  };
}

export function createSampleBrainrots(): Brainrot[] {
  return [
    {
      id: 'test-common',
      name: 'Common Sample',
      slug: 'common-sample',
      rarity: 'common',
      imageUrl: 'https://example.com/common.png',
      description: 'Un brainrot de test commun.',
      sourceStatus: 'canon',
      aliases: ['common']
    },
    {
      id: 'test-rare',
      name: 'Rare Sample',
      slug: 'rare-sample',
      rarity: 'rare',
      imageUrl: 'https://example.com/rare.png',
      description: 'Un brainrot de test rare.',
      sourceStatus: 'canon',
      aliases: ['rare']
    },
    {
      id: 'test-mythic',
      name: 'Mythic Sample',
      slug: 'mythic-sample',
      rarity: 'mythic',
      imageUrl: 'https://example.com/mythic.png',
      description: 'Un brainrot de test mythique.',
      sourceStatus: 'canon',
      aliases: ['mythic']
    }
  ];
}

export function createTestContext(): TestContext {
  const tempDirectory = mkdtempSync(join(tmpdir(), 'brainrot-bot-tests-'));
  const databasePath = join(tempDirectory, 'test.sqlite');
  const database = createDatabase(databasePath);

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
    tempDirectory,
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
    },
    close(): void {
      database.close();
      rmSync(tempDirectory, { recursive: true, force: true });
    }
  };
}
