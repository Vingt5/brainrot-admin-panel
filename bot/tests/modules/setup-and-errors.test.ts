import assert from 'node:assert/strict';
import test from 'node:test';

import { createSampleBrainrots, createTestContext, createUserSnapshot } from '../helpers/createTestContext.js';

test('setup peut configurer, exposer et reinitialiser le salon de jeu', () => {
  const context = createTestContext();

  try {
    const guildDiscordId = 'guild-setup';

    assert.equal(context.services.setupService.getGuildSetup(guildDiscordId), null);

    const configuredGuild = context.services.setupService.configureGuildChannel(guildDiscordId, 'channel-a');
    assert.equal(configuredGuild.configuredChannelId, 'channel-a');

    const storedAfterSet = context.services.setupService.getGuildSetup(guildDiscordId);
    assert.equal(storedAfterSet?.configuredChannelId, 'channel-a');

    const resetGuild = context.services.setupService.resetGuildChannel(guildDiscordId);
    assert.equal(resetGuild.configuredChannelId, null);

    const storedAfterReset = context.services.setupService.getGuildSetup(guildDiscordId);
    assert.equal(storedAfterReset?.configuredChannelId, null);
  } finally {
    context.close();
  }
});

test('roll refuse sans configuration et dans le mauvais salon', () => {
  const context = createTestContext();

  try {
    context.repositories.brainrotRepository.syncCatalog(createSampleBrainrots());

    const guildDiscordId = 'guild-roll-errors';
    const player = createUserSnapshot('user-roll-errors', 'Alice');

    const withoutSetup = context.services.rollService.createRoll({
      guildDiscordId,
      channelId: 'channel-a',
      user: player
    });

    assert.equal(withoutSetup.kind, 'guild_not_configured');

    context.services.setupService.configureGuildChannel(guildDiscordId, 'channel-a');

    const wrongChannel = context.services.rollService.createRoll({
      guildDiscordId,
      channelId: 'channel-b',
      user: player
    });

    assert.equal(wrongChannel.kind, 'wrong_channel');

    if (wrongChannel.kind === 'wrong_channel') {
      assert.equal(wrongChannel.configuredChannelId, 'channel-a');
    }
  } finally {
    context.close();
  }
});

test('claim laisse les anciens rolls reclamables et refuse les reclamations dans le mauvais salon', () => {
  const context = createTestContext();

  try {
    context.repositories.brainrotRepository.syncCatalog(createSampleBrainrots());

    const guildDiscordId = 'guild-claim-errors';
    const configuredChannelId = 'channel-a';
    const wrongChannelId = 'channel-b';
    const roller = createUserSnapshot('user-roller', 'Alice');
    const claimant = createUserSnapshot('user-claimant', 'Bob');

    context.services.setupService.configureGuildChannel(guildDiscordId, configuredChannelId);

    const rollerContext = context.services.playerService.ensurePlayerContext(roller, guildDiscordId);
    context.services.playerService.ensurePlayerContext(claimant, guildDiscordId);

    const brainrot = context.repositories.brainrotRepository.findAll()[0];
    assert.ok(brainrot);

    const oldRoll = context.repositories.activeRollRepository.createActiveRoll({
      guildId: rollerContext.guild.id,
      channelId: configuredChannelId,
      brainrotId: brainrot.databaseId,
      rolledByPlayerId: rollerContext.player.id,
      createdAt: '2026-01-01T10:00:00.000Z',
      expiresAt: '2026-01-01T10:00:05.000Z'
    });

    const oldRollClaimResult = context.services.claimService.claimRoll({
      guildDiscordId,
      channelId: configuredChannelId,
      rollId: oldRoll.id,
      user: claimant
    });

    assert.equal(oldRollClaimResult.kind, 'success');
    assert.equal(context.repositories.activeRollRepository.findById(oldRoll.id)?.status, 'claimed');

    const freshRoll = context.repositories.activeRollRepository.createActiveRoll({
      guildId: rollerContext.guild.id,
      channelId: configuredChannelId,
      brainrotId: brainrot.databaseId,
      rolledByPlayerId: rollerContext.player.id,
      createdAt: '2099-01-01T10:00:00.000Z',
      expiresAt: '2099-01-01T10:00:30.000Z'
    });

    const wrongChannelResult = context.services.claimService.claimRoll({
      guildDiscordId,
      channelId: wrongChannelId,
      rollId: freshRoll.id,
      user: claimant
    });

    assert.equal(wrongChannelResult.kind, 'wrong_channel');

    if (wrongChannelResult.kind === 'wrong_channel') {
      assert.equal(wrongChannelResult.configuredChannelId, configuredChannelId);
    }
  } finally {
    context.close();
  }
});
