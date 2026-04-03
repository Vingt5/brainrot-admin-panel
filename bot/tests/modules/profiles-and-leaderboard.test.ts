import assert from 'node:assert/strict';
import test from 'node:test';

import { createSampleBrainrots, createTestContext, createUserSnapshot } from '../helpers/createTestContext.js';

test('profil, inventaire, favoris et leaderboard calculent les vues attendues', () => {
  const context = createTestContext();

  try {
    context.repositories.brainrotRepository.syncCatalog(createSampleBrainrots());

    const guildDiscordId = 'guild-1';
    const channelId = 'channel-1';
    const alice = createUserSnapshot('user-1', 'Alice');
    const bob = createUserSnapshot('user-2', 'Bob');

    context.services.setupService.configureGuildChannel(guildDiscordId, channelId);

    const aliceContext = context.services.playerService.ensurePlayerContext(alice, guildDiscordId);
    const bobContext = context.services.playerService.ensurePlayerContext(bob, guildDiscordId);

    const brainrots = context.repositories.brainrotRepository.findAll();
    const commonBrainrot = brainrots.find((brainrot) => brainrot.slug === 'common-sample');
    const rareBrainrot = brainrots.find((brainrot) => brainrot.slug === 'rare-sample');
    const mythicBrainrot = brainrots.find((brainrot) => brainrot.slug === 'mythic-sample');

    assert.ok(commonBrainrot);
    assert.ok(rareBrainrot);
    assert.ok(mythicBrainrot);

    context.repositories.playerBrainrotRepository.incrementOwnership(
      aliceContext.player.id,
      commonBrainrot.databaseId,
      '2026-01-01T10:00:00.000Z'
    );
    context.repositories.playerBrainrotRepository.incrementOwnership(
      aliceContext.player.id,
      commonBrainrot.databaseId,
      '2026-01-01T10:05:00.000Z'
    );
    context.repositories.playerBrainrotRepository.incrementOwnership(
      aliceContext.player.id,
      rareBrainrot.databaseId,
      '2026-01-01T10:10:00.000Z'
    );
    context.repositories.playerBrainrotRepository.incrementOwnership(
      bobContext.player.id,
      mythicBrainrot.databaseId,
      '2026-01-01T10:15:00.000Z'
    );

    context.repositories.playerWishRepository.addWish(
      aliceContext.player.id,
      mythicBrainrot.databaseId,
      '2026-01-01T10:20:00.000Z'
    );
    context.repositories.playerFavoriteRepository.addFavorite(
      aliceContext.player.id,
      rareBrainrot.databaseId,
      '2026-01-01T10:21:00.000Z'
    );

    const aliceProfile = context.services.profileService.getProfile(alice);

    assert.equal(aliceProfile.stats.totalBrainrots, 3);
    assert.equal(aliceProfile.stats.uniqueBrainrots, 2);
    assert.equal(aliceProfile.stats.rarityScore, 5);
    assert.equal(aliceProfile.stats.score, 28);
    assert.equal(aliceProfile.stats.wishCount, 1);
    assert.equal(aliceProfile.stats.favoriteCount, 1);
    assert.equal(aliceProfile.stats.highestOwnedRarity, 'rare');
    assert.equal(aliceProfile.stats.lastObtainedBrainrot?.slug, 'rare-sample');

    const aliceInventory = context.services.inventoryService.getInventory(alice, 'rarity', 1);

    assert.equal(aliceInventory.totalEntries, 2);
    assert.equal(aliceInventory.items[0]?.brainrot.slug, 'rare-sample');
    assert.equal(aliceInventory.items[0]?.isFavorite, true);
    assert.equal(aliceInventory.items[1]?.quantity, 2);

    const aliceFavorites = context.services.inventoryService.getInventory(alice, 'rarity', 1, {
      favoritesOnly: true
    });

    assert.equal(aliceFavorites.totalEntries, 1);
    assert.equal(aliceFavorites.items[0]?.brainrot.slug, 'rare-sample');

    const leaderboard = context.services.leaderboardService.getLeaderboard(guildDiscordId);

    assert.equal(leaderboard.guildConfigured, true);
    assert.equal(leaderboard.entries.length, 2);
    assert.equal(leaderboard.entries[0]?.discordUserId, bob.discordUserId);
    assert.equal(leaderboard.entries[0]?.score, 71);
    assert.equal(leaderboard.entries[1]?.discordUserId, alice.discordUserId);
    assert.equal(leaderboard.entries[1]?.score, 28);
  } finally {
    context.close();
  }
});
