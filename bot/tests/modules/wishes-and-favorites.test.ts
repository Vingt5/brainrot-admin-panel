import assert from 'node:assert/strict';
import test from 'node:test';

import type { Brainrot } from '../../src/core/types.js';
import { createSampleBrainrots, createTestContext, createUserSnapshot } from '../helpers/createTestContext.js';

function createBrainrots(count: number): Brainrot[] {
  return Array.from({ length: count }, (_, index) => {
    const itemNumber = index + 1;

    return {
      id: `brainrot-${itemNumber}`,
      name: `Brainrot ${itemNumber}`,
      slug: `brainrot-${itemNumber}`,
      rarity: itemNumber === count ? 'legendary' : 'common',
      imageUrl: `https://example.com/brainrot-${itemNumber}.png`,
      description: `Description ${itemNumber}`,
      sourceStatus: 'canon',
      aliases: [`alias-${itemNumber}`]
    };
  });
}

test('wishlist ajoute, liste, retire, rejette les doublons et applique la limite', () => {
  const context = createTestContext();

  try {
    context.repositories.brainrotRepository.syncCatalog(createBrainrots(11));

    const user = createUserSnapshot('user-1', 'Alice');
    const guildDiscordId = 'guild-wishlist';

    for (let index = 1; index <= 10; index += 1) {
      const result = context.services.wishService.addWish({
        guildDiscordId,
        user,
        query: `Brainrot ${index}`
      });

      assert.equal(result.kind, 'success');
    }

    const duplicateResult = context.services.wishService.addWish({
      guildDiscordId,
      user,
      query: 'Brainrot 1'
    });
    assert.equal(duplicateResult.kind, 'duplicate');

    const limitResult = context.services.wishService.addWish({
      guildDiscordId,
      user,
      query: 'Brainrot 11'
    });
    assert.equal(limitResult.kind, 'limit_reached');

    const wishList = context.services.wishService.listWishes({
      guildDiscordId,
      user
    });
    assert.equal(wishList.totalEntries, 10);

    const removeResult = context.services.wishService.removeWish({
      guildDiscordId,
      user,
      query: 'Brainrot 2'
    });
    assert.equal(removeResult.kind, 'success');

    const updatedWishList = context.services.wishService.listWishes({
      guildDiscordId,
      user
    });
    assert.equal(updatedWishList.totalEntries, 9);
  } finally {
    context.close();
  }
});

test('wishlist résout nom exact, slug, alias exact et gère ambiguïté ou absence', () => {
  const context = createTestContext();

  try {
    const brainrots: Brainrot[] = [
      {
        id: 'alpha-exact',
        name: 'Alpha Exact',
        slug: 'alpha-exact',
        rarity: 'rare',
        imageUrl: 'https://example.com/alpha.png',
        description: 'Alpha exact',
        sourceStatus: 'canon',
        aliases: ['alpha']
      },
      {
        id: 'shared-one',
        name: 'Shared One',
        slug: 'shared-one',
        rarity: 'common',
        imageUrl: 'https://example.com/shared-one.png',
        description: 'Shared one',
        sourceStatus: 'canon',
        aliases: ['shared']
      },
      {
        id: 'shared-two',
        name: 'Shared Two',
        slug: 'shared-two',
        rarity: 'common',
        imageUrl: 'https://example.com/shared-two.png',
        description: 'Shared two',
        sourceStatus: 'canon',
        aliases: ['shared']
      }
    ];

    context.repositories.brainrotRepository.syncCatalog(brainrots);

    const user = createUserSnapshot('user-2', 'Bob');
    const guildDiscordId = 'guild-resolution';

    const addByName = context.services.wishService.addWish({
      guildDiscordId,
      user,
      query: 'Alpha Exact'
    });
    assert.equal(addByName.kind, 'success');

    const removeBySlug = context.services.wishService.removeWish({
      guildDiscordId,
      user,
      query: 'alpha-exact'
    });
    assert.equal(removeBySlug.kind, 'success');

    const addByAlias = context.services.wishService.addWish({
      guildDiscordId,
      user,
      query: 'alpha'
    });
    assert.equal(addByAlias.kind, 'success');

    const ambiguous = context.services.wishService.addWish({
      guildDiscordId,
      user,
      query: 'shared'
    });
    assert.equal(ambiguous.kind, 'ambiguous');

    if (ambiguous.kind === 'ambiguous') {
      assert.deepEqual(
        ambiguous.candidates.map((candidate) => candidate.slug),
        ['shared-one', 'shared-two']
      );
    }

    const notFound = context.services.wishService.addWish({
      guildDiscordId,
      user,
      query: 'does-not-exist'
    });
    assert.equal(notFound.kind, 'not_found');
  } finally {
    context.close();
  }
});

test('favoris exigent la possession et peuvent être retirés proprement', () => {
  const context = createTestContext();

  try {
    context.repositories.brainrotRepository.syncCatalog(createSampleBrainrots());

    const user = createUserSnapshot('user-3', 'Charlie');
    const guildDiscordId = 'guild-favorites';
    const playerContext = context.services.playerService.ensurePlayerContext(user, guildDiscordId);
    const rareBrainrot = context.repositories.brainrotRepository.findAll().find((brainrot) => brainrot.slug === 'rare-sample');

    assert.ok(rareBrainrot);

    const notOwned = context.services.favoriteService.addFavorite({
      guildDiscordId,
      user,
      query: 'Rare Sample'
    });
    assert.equal(notOwned.kind, 'not_owned');

    context.repositories.playerBrainrotRepository.incrementOwnership(
      playerContext.player.id,
      rareBrainrot.databaseId,
      '2026-01-01T10:00:00.000Z'
    );

    const addFavorite = context.services.favoriteService.addFavorite({
      guildDiscordId,
      user,
      query: 'rare'
    });
    assert.equal(addFavorite.kind, 'success');

    const duplicateFavorite = context.services.favoriteService.addFavorite({
      guildDiscordId,
      user,
      query: 'rare-sample'
    });
    assert.equal(duplicateFavorite.kind, 'already_favorite');

    const removeFavorite = context.services.favoriteService.removeFavorite({
      guildDiscordId,
      user,
      query: 'Rare Sample'
    });
    assert.equal(removeFavorite.kind, 'success');

    const missingFavorite = context.services.favoriteService.removeFavorite({
      guildDiscordId,
      user,
      query: 'Rare Sample'
    });
    assert.equal(missingFavorite.kind, 'not_favorite');
  } finally {
    context.close();
  }
});

test('le highlight de wish cible seulement les joueurs connus du serveur et limite les mentions', () => {
  const context = createTestContext();

  try {
    context.repositories.brainrotRepository.syncCatalog(createSampleBrainrots());

    const guildDiscordId = 'guild-highlight';
    const otherGuildDiscordId = 'guild-other';
    const mythicBrainrot = context.repositories.brainrotRepository.findAll().find((brainrot) => brainrot.slug === 'mythic-sample');

    assert.ok(mythicBrainrot);

    for (let index = 1; index <= 12; index += 1) {
      const user = createUserSnapshot(`user-highlight-${index}`, `User ${index}`);

      const result = context.services.wishService.addWish({
        guildDiscordId,
        user,
        query: 'Mythic Sample'
      });

      assert.equal(result.kind, 'success');
    }

    const outsider = createUserSnapshot('user-outsider', 'Outsider');
    const outsiderResult = context.services.wishService.addWish({
      guildDiscordId: otherGuildDiscordId,
      user: outsider,
      query: 'Mythic Sample'
    });
    assert.equal(outsiderResult.kind, 'success');

    const highlight = context.services.wishService.getRollHighlight(
      guildDiscordId,
      mythicBrainrot.databaseId
    );

    assert.equal(highlight.totalWishers, 12);
    assert.equal(highlight.mentionedDiscordUserIds.length, 10);
    assert.ok(highlight.mentionText?.includes('+2'));
    assert.equal(highlight.mentionedDiscordUserIds.includes(outsider.discordUserId), false);
  } finally {
    context.close();
  }
});
