import assert from 'node:assert/strict';
import test from 'node:test';

import { createSampleBrainrots, createTestContext, createUserSnapshot } from '../helpers/createTestContext.js';

test('plusieurs rolls peuvent rester actifs en parallele et les claims restent illimites', () => {
  const context = createTestContext();

  try {
    context.repositories.brainrotRepository.syncCatalog(createSampleBrainrots());

    const guildDiscordId = 'guild-1';
    const channelId = 'channel-1';
    const roller = createUserSnapshot('user-1', 'Alice');
    const claimant = createUserSnapshot('user-2', 'Bob');
    const secondRoller = createUserSnapshot('user-3', 'Charlie');

    context.services.setupService.configureGuildChannel(guildDiscordId, channelId);

    const firstRollAttempt = context.services.rollService.createRoll({
      guildDiscordId,
      channelId,
      user: roller
    });

    assert.equal(firstRollAttempt.kind, 'success');

    if (firstRollAttempt.kind !== 'success') {
      return;
    }

    const secondImmediateRollAttempt = context.services.rollService.createRoll({
      guildDiscordId,
      channelId,
      user: roller
    });

    assert.equal(secondImmediateRollAttempt.kind, 'success');

    const thirdParallelRollAttempt = context.services.rollService.createRoll({
      guildDiscordId,
      channelId,
      user: claimant
    });

    assert.equal(thirdParallelRollAttempt.kind, 'success');

    const firstClaimAttempt = context.services.claimService.claimRoll({
      guildDiscordId,
      channelId,
      rollId: firstRollAttempt.roll.id,
      user: claimant
    });

    assert.equal(firstClaimAttempt.kind, 'success');

    if (firstClaimAttempt.kind !== 'success') {
      return;
    }

    assert.equal(firstClaimAttempt.roll.claimedByDiscordUserId, claimant.discordUserId);

    const secondClaimAttempt = context.services.claimService.claimRoll({
      guildDiscordId,
      channelId,
      rollId: firstRollAttempt.roll.id,
      user: roller
    });

    assert.equal(secondClaimAttempt.kind, 'already_claimed');

    const rerollWithoutCooldownAttempt = context.services.rollService.createRoll({
      guildDiscordId,
      channelId,
      user: roller
    });

    assert.equal(rerollWithoutCooldownAttempt.kind, 'success');

    const fourthParallelRollAttempt = context.services.rollService.createRoll({
      guildDiscordId,
      channelId,
      user: secondRoller
    });

    assert.equal(fourthParallelRollAttempt.kind, 'success');

    if (fourthParallelRollAttempt.kind !== 'success') {
      return;
    }

    const secondWinningClaimAttempt = context.services.claimService.claimRoll({
      guildDiscordId,
      channelId,
      rollId: fourthParallelRollAttempt.roll.id,
      user: claimant
    });

    assert.equal(secondWinningClaimAttempt.kind, 'success');
  } finally {
    context.close();
  }
});
