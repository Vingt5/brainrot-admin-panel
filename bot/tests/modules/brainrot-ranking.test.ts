import assert from 'node:assert/strict';
import test from 'node:test';

import type { Brainrot } from '../../src/core/types.js';
import { createTestContext, createUserSnapshot } from '../helpers/createTestContext.js';

test('le classement des brainrots convoités trie par rareté puis par rareté en collection', () => {
  const context = createTestContext();

  try {
    const customBrainrots: Brainrot[] = [
      {
        id: 'legendary-apex',
        name: 'Legendary Apex',
        slug: 'legendary-apex',
        rarity: 'legendary',
        imageUrl: 'assets/test/legendary-apex.png',
        description: 'Un brainrot légendaire de test.',
        sourceStatus: 'canon',
        aliases: ['legendary']
      },
      {
        id: 'rare-zero-owner',
        name: 'Rare Zero Owner',
        slug: 'rare-zero-owner',
        rarity: 'rare',
        imageUrl: 'assets/test/rare-zero-owner.png',
        description: 'Un brainrot rare encore absent des collections.',
        sourceStatus: 'canon',
        aliases: ['rare-zero']
      },
      {
        id: 'rare-one-owner',
        name: 'Rare One Owner',
        slug: 'rare-one-owner',
        rarity: 'rare',
        imageUrl: 'assets/test/rare-one-owner.png',
        description: 'Un brainrot rare déjà possédé.',
        sourceStatus: 'canon',
        aliases: ['rare-one']
      },
      {
        id: 'common-sample',
        name: 'Common Sample',
        slug: 'common-sample',
        rarity: 'common',
        imageUrl: 'assets/test/common-sample.png',
        description: 'Un brainrot commun de test.',
        sourceStatus: 'canon',
        aliases: ['common']
      }
    ];

    context.repositories.brainrotRepository.syncCatalog(customBrainrots);

    const guildDiscordId = 'guild-ranking';
    const alice = createUserSnapshot('user-1', 'Alice');
    const playerContext = context.services.playerService.ensurePlayerContext(alice, guildDiscordId);

    const brainrots = context.repositories.brainrotRepository.findAll();
    const legendary = brainrots.find((brainrot) => brainrot.slug === 'legendary-apex');
    const rareOneOwner = brainrots.find((brainrot) => brainrot.slug === 'rare-one-owner');
    const common = brainrots.find((brainrot) => brainrot.slug === 'common-sample');

    assert.ok(legendary);
    assert.ok(rareOneOwner);
    assert.ok(common);

    context.repositories.playerBrainrotRepository.incrementOwnership(
      playerContext.player.id,
      legendary.databaseId,
      '2026-01-01T10:00:00.000Z'
    );
    context.repositories.playerBrainrotRepository.incrementOwnership(
      playerContext.player.id,
      rareOneOwner.databaseId,
      '2026-01-01T10:10:00.000Z'
    );
    context.repositories.playerBrainrotRepository.incrementOwnership(
      playerContext.player.id,
      common.databaseId,
      '2026-01-01T10:20:00.000Z'
    );
    context.repositories.playerBrainrotRepository.incrementOwnership(
      playerContext.player.id,
      common.databaseId,
      '2026-01-01T10:30:00.000Z'
    );

    const ranking = context.services.brainrotRankingService.getTopBrainrots(4);

    assert.equal(ranking.entries.length, 4);
    assert.equal(ranking.entries[0]?.brainrot.slug, 'legendary-apex');
    assert.equal(ranking.entries[1]?.brainrot.slug, 'rare-zero-owner');
    assert.equal(ranking.entries[1]?.ownerCount, 0);
    assert.equal(ranking.entries[2]?.brainrot.slug, 'rare-one-owner');
    assert.equal(ranking.entries[2]?.ownerCount, 1);
    assert.equal(ranking.entries[3]?.brainrot.slug, 'common-sample');
    assert.equal(ranking.entries[3]?.totalOwned, 2);
  } finally {
    context.close();
  }
});
