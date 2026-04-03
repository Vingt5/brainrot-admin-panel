import { ChannelType, type Message, type User } from 'discord.js';

import { ROLL_DELAY_MAX_MS, ROLL_DELAY_MIN_MS } from '../../config/game.js';
import type { AppContext } from '../../core/appContext.js';
import type { InventorySort } from '../../core/types.js';
import { isInventorySort } from '../../core/types.js';
import { toDiscordUserSnapshot } from '../../utils/discordUser.js';
import { randomInteger } from '../../utils/random.js';
import { sleep } from '../../utils/sleep.js';
import { formatDuration } from '../../utils/time.js';
import { buildClaimButtonRow, buildRevealMessage } from '../builders/brainrotMessageBuilder.js';
import { buildCooldownEmbed } from '../builders/cooldownEmbedBuilder.js';
import { buildHelpEmbed } from '../builders/helpEmbedBuilder.js';
import { buildInventoryMessage, buildInventoryPaginationRow } from '../builders/inventoryEmbedBuilder.js';
import { buildLeaderboardEmbed } from '../builders/leaderboardEmbedBuilder.js';
import { buildProfileMessage } from '../builders/profileEmbedBuilder.js';
import { buildSearchMessage } from '../builders/searchEmbedBuilder.js';
import { buildTopBrainrotsMessage } from '../builders/topBrainrotsEmbedBuilder.js';
import { buildWishListMessage } from '../builders/wishListEmbedBuilder.js';
import { ensureConfiguredGameMessage } from '../guards/ensureConfiguredGameMessage.js';
import { requireAdministratorMessage } from '../guards/requireAdministratorMessage.js';
import type { PrefixCommandHandler } from '../registry/types.js';
import { formatResolutionError } from './collectorCommandUtils.js';

const inventorySortAliases = {
  r: 'rarity',
  rarity: 'rarity',
  q: 'quantity',
  qty: 'quantity',
  quantity: 'quantity',
  rec: 'recent',
  recent: 'recent',
  abc: 'alphabetical',
  alpha: 'alphabetical',
  alphabetical: 'alphabetical'
} as const satisfies Record<string, InventorySort>;

const favoriteFilterTokens = new Set(['fav', 'favorite', 'favorites', 'star']);

function getTargetUser(message: Message<true>): User {
  return message.mentions.users.first() ?? message.author;
}

function getInventorySort(args: string[]): InventorySort {
  for (const arg of args) {
    const normalizedArg = arg.toLowerCase();
    const mappedSort = inventorySortAliases[normalizedArg as keyof typeof inventorySortAliases];

    if (mappedSort) {
      return mappedSort;
    }

    if (isInventorySort(normalizedArg)) {
      return normalizedArg;
    }
  }

  return 'rarity';
}

function getInventoryFavoritesOnly(args: string[]): boolean {
  return args.some((arg) => favoriteFilterTokens.has(arg.toLowerCase()));
}

function getSetupUsage(prefix: string): string {
  return `Usage : \`${prefix}setup set #salon\`, \`${prefix}setup status\` ou \`${prefix}setup reset\``;
}

function resolveSetupChannel(message: Message<true>, args: string[]) {
  const mentionedChannel = message.mentions.channels.first();

  if (mentionedChannel?.type === ChannelType.GuildText) {
    return mentionedChannel;
  }

  for (const arg of args) {
    if (!/^\d+$/.test(arg)) {
      continue;
    }

    const channel = message.guild.channels.cache.get(arg);

    if (channel?.type === ChannelType.GuildText) {
      return channel;
    }
  }

  return null;
}

function getQueryFromArgs(args: string[], startIndex: number): string {
  return args.slice(startIndex).join(' ').trim();
}

const prefixSetupCommand: PrefixCommandHandler = {
  aliases: ['setup'],
  async execute(message, args, context) {
    if (!(await requireAdministratorMessage(message, context))) {
      return;
    }

    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
      case 'set': {
        const channel = resolveSetupChannel(message, args.slice(1));

        if (!channel) {
          await message.reply({
            content: `Salon texte invalide. ${getSetupUsage(context.config.commandPrefix)}`
          });
          return;
        }

        const guild = context.services.setupService.configureGuildChannel(message.guildId, channel.id);

        await message.reply({
          content: `Salon de jeu configuré avec succès : <#${guild.configuredChannelId}>`
        });
        return;
      }
      case 'status': {
        const guild = context.services.setupService.getGuildSetup(message.guildId);

        await message.reply({
          content: guild?.configuredChannelId
            ? `Salon actuellement configuré : <#${guild.configuredChannelId}>`
            : 'Aucun salon de jeu n’est actuellement configuré sur ce serveur.'
        });
        return;
      }
      case 'reset': {
        context.services.setupService.resetGuildChannel(message.guildId);

        await message.reply({
          content: `Configuration du salon de jeu supprimée. Le bot refusera désormais les commandes de gameplay jusqu’à un nouveau \`${context.config.commandPrefix}setup set #salon\`.`
        });
        return;
      }
      default: {
        await message.reply({
          content: getSetupUsage(context.config.commandPrefix)
        });
      }
    }
  }
};

const prefixRollCommand: PrefixCommandHandler = {
  aliases: ['r', 'roll'],
  async execute(message, _args, context) {
    const result = context.services.rollService.createRoll({
      guildDiscordId: message.guildId,
      channelId: message.channelId,
      user: toDiscordUserSnapshot(message.author)
    });

    switch (result.kind) {
      case 'guild_not_configured':
        await message.reply({
          content: `Aucun salon de jeu n’est configuré. Utilise \`${context.config.commandPrefix}setup set #salon\` ou \`/setup set\` d’abord.`
        });
        return;
      case 'wrong_channel':
        await message.reply({
          content: `Cette commande est autorisée uniquement dans <#${result.configuredChannelId}>.`
        });
        return;
      case 'cooldown':
        await message.reply({
          content: `Ton prochain roll sera disponible dans ${formatDuration(result.remainingMs)}.`
        });
        return;
      case 'no_brainrots':
        await message.reply({
          content: 'La base ne contient encore aucun brainrot seedé. Lance `npm run db:seed` d’abord.'
        });
        return;
      case 'success':
        break;
    }

    try {
      await sleep(randomInteger(ROLL_DELAY_MIN_MS, ROLL_DELAY_MAX_MS));

      const wishHighlight = context.services.wishService.getRollHighlight(
        message.guildId,
        result.roll.brainrot.databaseId
      );
      const reveal = buildRevealMessage(result.roll, wishHighlight);
      const reply = await message.reply({
        content: wishHighlight.mentionText ?? undefined,
        embeds: [reveal.embed],
        components: [buildClaimButtonRow(result.roll.id, result.roll.brainrot.rarity, 'active')],
        files: reveal.files,
        allowedMentions: {
          users: wishHighlight.mentionedDiscordUserIds
        }
      });

      context.services.rollService.attachMessageId(result.roll.id, reply.id);
    } catch (error) {
      context.services.rollService.cancelUnpublishedRoll(result.roll.id);

      throw error;
    }
  }
};

const prefixProfileCommand: PrefixCommandHandler = {
  aliases: ['p', 'pr', 'profile'],
  async execute(message, _args, context) {
    if (!(await ensureConfiguredGameMessage(message, context))) {
      return;
    }

    context.services.playerService.ensurePlayerContext(toDiscordUserSnapshot(message.author), message.guildId);

    const targetUser = getTargetUser(message);
    const profile = context.services.profileService.getProfile(toDiscordUserSnapshot(targetUser));
    const builtMessage = buildProfileMessage(profile, context.services.brainrotService.countBrainrots());

    await message.reply({
      embeds: [builtMessage.embed],
      files: builtMessage.files
    });
  }
};

const prefixInventoryCommand: PrefixCommandHandler = {
  aliases: ['i', 'inv', 'inventory'],
  async execute(message, args, context) {
    if (!(await ensureConfiguredGameMessage(message, context))) {
      return;
    }

    context.services.playerService.ensurePlayerContext(toDiscordUserSnapshot(message.author), message.guildId);

    const targetUser = getTargetUser(message);
    const sort = getInventorySort(args);
    const favoritesOnly = getInventoryFavoritesOnly(args);
    const page = context.services.inventoryService.getInventory(toDiscordUserSnapshot(targetUser), sort, 1, {
      favoritesOnly
    });
    const builtMessage = buildInventoryMessage(page, context.services.brainrotService.countBrainrots());

    await message.reply({
      embeds: [builtMessage.embed],
      components: [
        buildInventoryPaginationRow(
          message.author.id,
          targetUser.id,
          sort,
          page.page,
          page.totalPages,
          favoritesOnly
        )
      ],
      files: builtMessage.files
    });
  }
};

const prefixWishCommand: PrefixCommandHandler = {
  aliases: ['wish', 'wishes'],
  async execute(message, args, context) {
    if (!(await ensureConfiguredGameMessage(message, context))) {
      return;
    }

    const subcommand = args[0]?.toLowerCase();
    const user = toDiscordUserSnapshot(message.author);

    switch (subcommand) {
      case 'add': {
        const query = getQueryFromArgs(args, 1);

        if (!query) {
          await message.reply({
            content: `Usage : \`${context.config.commandPrefix}wish add <brainrot>\``
          });
          return;
        }

        const result = context.services.wishService.addWish({
          guildDiscordId: message.guildId,
          user,
          query
        });

        switch (result.kind) {
          case 'success':
            await message.reply({
              content: `Wish ajoutée : **${result.brainrot.name}** (${result.totalWishes}/10).`
            });
            return;
          case 'duplicate':
            await message.reply({
              content: `**${result.brainrot.name}** est déjà dans ta wishlist (${result.totalWishes}/10).`
            });
            return;
          case 'limit_reached':
            await message.reply({
              content: `Ta wishlist est pleine (${result.totalWishes}/${result.limit}).`
            });
            return;
          case 'ambiguous':
          case 'not_found':
            await message.reply({
              content: formatResolutionError(result)
            });
            return;
          case 'not_wished':
            return;
        }
      }
      case 'remove': {
        const query = getQueryFromArgs(args, 1);

        if (!query) {
          await message.reply({
            content: `Usage : \`${context.config.commandPrefix}wish remove <brainrot>\``
          });
          return;
        }

        const result = context.services.wishService.removeWish({
          guildDiscordId: message.guildId,
          user,
          query
        });

        switch (result.kind) {
          case 'success':
            await message.reply({
              content: `Wish retirée : **${result.brainrot.name}** (${result.totalWishes}/10 restantes).`
            });
            return;
          case 'not_wished':
            await message.reply({
              content: `**${result.brainrot.name}** n’est pas dans ta wishlist.`
            });
            return;
          case 'ambiguous':
          case 'not_found':
            await message.reply({
              content: formatResolutionError(result)
            });
            return;
          case 'duplicate':
          case 'limit_reached':
            return;
        }
      }
      case 'list': {
        const view = context.services.wishService.listWishes({
          guildDiscordId: message.guildId,
          user
        });
        const builtMessage = buildWishListMessage(view);

        await message.reply({
          embeds: [builtMessage.embed],
          files: builtMessage.files
        });
        return;
      }
      default: {
        await message.reply({
          content: `Usage : \`${context.config.commandPrefix}wish add <brainrot>\`, \`${context.config.commandPrefix}wish remove <brainrot>\` ou \`${context.config.commandPrefix}wish list\``
        });
      }
    }
  }
};

const prefixFavoriteCommand: PrefixCommandHandler = {
  aliases: ['fav', 'favorite', 'favorites'],
  async execute(message, args, context) {
    if (!(await ensureConfiguredGameMessage(message, context))) {
      return;
    }

    const subcommand = args[0]?.toLowerCase();
    const user = toDiscordUserSnapshot(message.author);

    switch (subcommand) {
      case 'add': {
        const query = getQueryFromArgs(args, 1);

        if (!query) {
          await message.reply({
            content: `Usage : \`${context.config.commandPrefix}fav add <brainrot>\``
          });
          return;
        }

        const result = context.services.favoriteService.addFavorite({
          guildDiscordId: message.guildId,
          user,
          query
        });

        switch (result.kind) {
          case 'success':
            await message.reply({
              content: `Favori ajouté : **${result.brainrot.name}** (${result.totalFavorites} total).`
            });
            return;
          case 'already_favorite':
            await message.reply({
              content: `**${result.brainrot.name}** est déjà dans tes favoris.`
            });
            return;
          case 'not_owned':
            await message.reply({
              content: `Tu dois posséder **${result.brainrot.name}** avant de le mettre en favori.`
            });
            return;
          case 'ambiguous':
          case 'not_found':
            await message.reply({
              content: formatResolutionError(result)
            });
            return;
          case 'not_favorite':
            return;
        }
      }
      case 'remove': {
        const query = getQueryFromArgs(args, 1);

        if (!query) {
          await message.reply({
            content: `Usage : \`${context.config.commandPrefix}fav remove <brainrot>\``
          });
          return;
        }

        const result = context.services.favoriteService.removeFavorite({
          guildDiscordId: message.guildId,
          user,
          query
        });

        switch (result.kind) {
          case 'success':
            await message.reply({
              content: `Favori retiré : **${result.brainrot.name}** (${result.totalFavorites} restants).`
            });
            return;
          case 'not_favorite':
            await message.reply({
              content: `**${result.brainrot.name}** n’est pas dans tes favoris.`
            });
            return;
          case 'ambiguous':
          case 'not_found':
            await message.reply({
              content: formatResolutionError(result)
            });
            return;
          case 'already_favorite':
          case 'not_owned':
            return;
        }
      }
      default: {
        await message.reply({
          content: `Usage : \`${context.config.commandPrefix}fav add <brainrot>\` ou \`${context.config.commandPrefix}fav remove <brainrot>\``
        });
      }
    }
  }
};

const prefixSearchCommand: PrefixCommandHandler = {
  aliases: ['search'],
  async execute(message, args, context) {
    if (!(await ensureConfiguredGameMessage(message, context))) {
      return;
    }

    const query = getQueryFromArgs(args, 0);

    if (!query) {
      await message.reply({
        content: `Usage : \`${context.config.commandPrefix}search <brainrot>\``
      });
      return;
    }

    const user = toDiscordUserSnapshot(message.author);
    context.services.playerService.ensurePlayerContext(user, message.guildId);

    const view = context.services.brainrotSearchService.search(user, query);

    if (view.entries.length === 0) {
      await message.reply({
        content: `Aucun brainrot trouvé pour \`${query}\`.`
      });
      return;
    }

    const builtMessage = buildSearchMessage(view);

    await message.reply({
      embeds: [builtMessage.embed],
      files: builtMessage.files
    });
  }
};

const prefixLeaderboardCommand: PrefixCommandHandler = {
  aliases: ['lb', 'top', 'leaderboard'],
  async execute(message, _args, context) {
    if (!(await ensureConfiguredGameMessage(message, context))) {
      return;
    }

    context.services.playerService.ensurePlayerContext(toDiscordUserSnapshot(message.author), message.guildId);

    const view = context.services.leaderboardService.getLeaderboard(message.guildId);

    await message.reply({
      embeds: [buildLeaderboardEmbed(view)]
    });
  }
};

const prefixTopBrainrotsCommand: PrefixCommandHandler = {
  aliases: ['tb', 'topb', 'topbrainrots'],
  async execute(message, args, context) {
    if (!(await ensureConfiguredGameMessage(message, context))) {
      return;
    }

    const requestedLimit = args[0] ? Number(args[0]) : null;
    const limit =
      requestedLimit !== null && Number.isInteger(requestedLimit)
        ? Math.min(Math.max(requestedLimit, 3), 15)
        : 10;

    const view = context.services.brainrotRankingService.getTopBrainrots(limit);
    const builtMessage = buildTopBrainrotsMessage(view);

    await message.reply({
      embeds: [builtMessage.embed],
      files: builtMessage.files
    });
  }
};

const prefixCooldownCommand: PrefixCommandHandler = {
  aliases: ['cd', 'cooldown'],
  async execute(message, _args, context) {
    if (!(await ensureConfiguredGameMessage(message, context))) {
      return;
    }

    context.services.playerService.ensurePlayerContext(toDiscordUserSnapshot(message.author), message.guildId);

    const cooldowns = context.services.cooldownService.getCooldowns(message.author.id);

    await message.reply({
      embeds: [buildCooldownEmbed(cooldowns, context.config.commandPrefix)]
    });
  }
};

const prefixHelpCommand: PrefixCommandHandler = {
  aliases: ['h', 'help'],
  async execute(message, _args, context) {
    await message.reply({
      embeds: [buildHelpEmbed(context.config.commandPrefix)]
    });
  }
};

export const prefixCommands: readonly PrefixCommandHandler[] = [
  prefixSetupCommand,
  prefixRollCommand,
  prefixProfileCommand,
  prefixInventoryCommand,
  prefixWishCommand,
  prefixFavoriteCommand,
  prefixSearchCommand,
  prefixLeaderboardCommand,
  prefixTopBrainrotsCommand,
  prefixCooldownCommand,
  prefixHelpCommand
];
