import assert from 'node:assert/strict';
import test from 'node:test';
import { MessageFlags, type ChatInputCommandInteraction, type Message } from 'discord.js';

import type { AppContext } from '../../src/core/appContext.js';
import { buildRevealMessage } from '../../src/discord/builders/brainrotMessageBuilder.js';
import { inventoryCommand } from '../../src/discord/commands/inventoryCommand.js';
import { prefixCommands } from '../../src/discord/commands/prefixCommands.js';
import { wishCommand } from '../../src/discord/commands/wishCommand.js';
import { createSampleBrainrots, createTestContext, createUserSnapshot, type TestContext } from '../helpers/createTestContext.js';

function createCommandContext(testContext: TestContext): AppContext {
  return {
    config: {
      discordToken: null,
      discordClientId: null,
      discordGuildId: null,
      commandPrefix: '%',
      databasePath: ':memory:',
      logLevel: 'info'
    },
    services: testContext.services,
    repositories: testContext.repositories
  } as unknown as AppContext;
}

function createSlashInteraction(options: {
  userId: string;
  username: string;
  guildId: string;
  channelId: string;
  subcommand?: string;
  brainrot?: string;
  sort?: string;
  favoritesOnly?: boolean;
}) {
  const replies: unknown[] = [];

  const interaction = {
    guildId: options.guildId,
    channelId: options.channelId,
    user: {
      id: options.userId,
      username: options.username,
      globalName: null
    },
    options: {
      getSubcommand: () => options.subcommand ?? 'list',
      getString: (name: string) => {
        if (name === 'brainrot') {
          return options.brainrot ?? null;
        }

        if (name === 'sort') {
          return options.sort ?? null;
        }

        return null;
      },
      getBoolean: (name: string) => (name === 'favorites_only' ? options.favoritesOnly ?? null : null),
      getUser: () => null
    },
    deferred: false,
    replied: false,
    reply: async (payload: unknown) => {
      replies.push(payload);
    },
    followUp: async (payload: unknown) => {
      replies.push(payload);
    }
  };

  return {
    interaction: interaction as unknown as ChatInputCommandInteraction,
    replies
  };
}

function createPrefixMessage(options: {
  userId: string;
  username: string;
  guildId: string;
  channelId: string;
}) {
  const replies: unknown[] = [];

  const message = {
    guildId: options.guildId,
    channelId: options.channelId,
    author: {
      id: options.userId,
      username: options.username,
      globalName: null,
      bot: false
    },
    mentions: {
      users: {
        first: () => undefined
      },
      channels: {
        first: () => undefined
      }
    },
    guild: {
      channels: {
        cache: new Map<string, unknown>()
      }
    },
    reply: async (payload: unknown) => {
      replies.push(payload);
      return payload;
    }
  };

  return {
    message: message as unknown as Message<true>,
    replies
  };
}

test('slash /wish add répond en éphémère sur un ajout valide', async () => {
  const context = createTestContext();

  try {
    context.repositories.brainrotRepository.syncCatalog(createSampleBrainrots());
    context.services.setupService.configureGuildChannel('guild-discord', 'channel-discord');

    const { interaction, replies } = createSlashInteraction({
      userId: 'user-1',
      username: 'Alice',
      guildId: 'guild-discord',
      channelId: 'channel-discord',
      subcommand: 'add',
      brainrot: 'Rare Sample'
    });

    await wishCommand.execute(interaction, createCommandContext(context));

    assert.equal(replies.length, 1);
    const payload = replies[0] as { content?: string; flags?: MessageFlags };
    assert.match(payload.content ?? '', /Wish ajoutée/);
    assert.equal(payload.flags, MessageFlags.Ephemeral);
  } finally {
    context.close();
  }
});

test('slash /inventory favorites_only affiche le filtre et le marquage favori', async () => {
  const context = createTestContext();

  try {
    context.repositories.brainrotRepository.syncCatalog(createSampleBrainrots());
    context.services.setupService.configureGuildChannel('guild-inventory', 'channel-inventory');

    const user = createUserSnapshot('user-2', 'Bob');
    const playerContext = context.services.playerService.ensurePlayerContext(user, 'guild-inventory');
    const rareBrainrot = context.repositories.brainrotRepository.findAll().find((brainrot) => brainrot.slug === 'rare-sample');

    assert.ok(rareBrainrot);

    context.repositories.playerBrainrotRepository.incrementOwnership(
      playerContext.player.id,
      rareBrainrot.databaseId,
      '2026-01-01T10:00:00.000Z'
    );
    context.repositories.playerFavoriteRepository.addFavorite(
      playerContext.player.id,
      rareBrainrot.databaseId,
      '2026-01-01T10:01:00.000Z'
    );

    const { interaction, replies } = createSlashInteraction({
      userId: user.discordUserId,
      username: user.username,
      guildId: 'guild-inventory',
      channelId: 'channel-inventory',
      sort: 'rarity',
      favoritesOnly: true
    });

    await inventoryCommand.execute(interaction, createCommandContext(context));

    const payload = replies[0] as { embeds: Array<{ toJSON(): { description?: string; fields?: Array<{ name: string; value: string }> } }> };
    const embedJson = payload.embeds[0]?.toJSON();

    assert.match(embedJson?.description ?? '', /⭐ Rare Sample/);
    assert.equal(embedJson?.fields?.find((field) => field.name === 'Filtre')?.value, 'Favoris uniquement');
  } finally {
    context.close();
  }
});

test('commande préfixée %wish add ajoute une wish et %search affiche les états collector', async () => {
  const context = createTestContext();

  try {
    context.repositories.brainrotRepository.syncCatalog(createSampleBrainrots());
    context.services.setupService.configureGuildChannel('guild-prefix', 'channel-prefix');

    const user = createUserSnapshot('user-3', 'Charlie');
    const playerContext = context.services.playerService.ensurePlayerContext(user, 'guild-prefix');
    const rareBrainrot = context.repositories.brainrotRepository.findAll().find((brainrot) => brainrot.slug === 'rare-sample');

    assert.ok(rareBrainrot);

    context.repositories.playerBrainrotRepository.incrementOwnership(
      playerContext.player.id,
      rareBrainrot.databaseId,
      '2026-01-01T10:00:00.000Z'
    );
    context.repositories.playerFavoriteRepository.addFavorite(
      playerContext.player.id,
      rareBrainrot.databaseId,
      '2026-01-01T10:01:00.000Z'
    );

    const wishHandler = prefixCommands.find((command) => command.aliases.includes('wish'));
    const searchHandler = prefixCommands.find((command) => command.aliases.includes('search'));

    assert.ok(wishHandler);
    assert.ok(searchHandler);

    const { message: wishMessage, replies: wishReplies } = createPrefixMessage({
      userId: user.discordUserId,
      username: user.username,
      guildId: 'guild-prefix',
      channelId: 'channel-prefix'
    });

    await wishHandler.execute(wishMessage, ['add', 'Rare', 'Sample'], createCommandContext(context));

    assert.match((wishReplies[0] as { content?: string }).content ?? '', /Wish ajoutée/);

    const { message: searchMessage, replies: searchReplies } = createPrefixMessage({
      userId: user.discordUserId,
      username: user.username,
      guildId: 'guild-prefix',
      channelId: 'channel-prefix'
    });

    await searchHandler.execute(searchMessage, ['rare'], createCommandContext(context));

    const payload = searchReplies[0] as { embeds: Array<{ toJSON(): { description?: string; fields?: Array<{ value: string }> } }> };
    const embedJson = payload.embeds[0]?.toJSON();

    assert.match(embedJson?.description ?? '', /Rare Sample/);
    assert.match(embedJson?.fields?.[0]?.value ?? '', /Possédé: \*\*Oui/);
    assert.match(embedJson?.fields?.[0]?.value ?? '', /Wish: \*\*Oui/);
    assert.match(embedJson?.fields?.[0]?.value ?? '', /Favori: \*\*Oui/);
  } finally {
    context.close();
  }
});

test('le reveal Discord affiche le signalement de wish', () => {
  const context = createTestContext();

  try {
    context.repositories.brainrotRepository.syncCatalog(
      createSampleBrainrots().filter((brainrot) => brainrot.slug === 'mythic-sample')
    );
    context.services.setupService.configureGuildChannel('guild-reveal', 'channel-reveal');

    const roller = createUserSnapshot('user-4', 'Dana');
    const watcher = createUserSnapshot('user-5', 'Evan');

    const wishResult = context.services.wishService.addWish({
      guildDiscordId: 'guild-reveal',
      user: watcher,
      query: 'Mythic Sample'
    });
    assert.equal(wishResult.kind, 'success');

    const rollResult = context.services.rollService.createRoll({
      guildDiscordId: 'guild-reveal',
      channelId: 'channel-reveal',
      user: roller
    });
    assert.equal(rollResult.kind, 'success');

    if (rollResult.kind !== 'success') {
      return;
    }

    const highlight = context.services.wishService.getRollHighlight(
      'guild-reveal',
      rollResult.roll.brainrot.databaseId
    );
    const reveal = buildRevealMessage(rollResult.roll, highlight);
    const embedJson = reveal.embed.toJSON();

    assert.equal(rollResult.roll.brainrot.slug, 'mythic-sample');
    assert.match(embedJson.description ?? '', /Wish detectee/);
  } finally {
    context.close();
  }
});
