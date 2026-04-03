import dotenv from 'dotenv';

import type { LogLevel } from '../core/logger.js';

dotenv.config();

export interface AppEnv {
  discordToken: string | null;
  discordClientId: string | null;
  discordGuildId: string | null;
  commandPrefix: string;
  databasePath: string;
  logLevel: LogLevel;
}

const allowedLogLevels: readonly LogLevel[] = ['debug', 'info', 'warn', 'error'] as const;

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variable d'environnement requise manquante : ${name}`);
  }

  return value;
}

function parseLogLevel(value: string | undefined): LogLevel {
  if (value && allowedLogLevels.includes(value as LogLevel)) {
    return value as LogLevel;
  }

  return 'info';
}

function parseCommandPrefix(value: string | undefined): string {
  const prefix = (value ?? '%').trim();

  if (prefix.length !== 1) {
    throw new Error('COMMAND_PREFIX doit contenir exactement un seul caractère non vide.');
  }

  return prefix;
}

export interface LoadEnvOptions {
  requireDiscord?: boolean;
  requireGuildId?: boolean;
}

export function loadEnv(options: LoadEnvOptions = {}): AppEnv {
  const requireDiscord = options.requireDiscord ?? true;
  const requireGuildId = options.requireGuildId ?? false;
  const discordToken = requireDiscord ? requireEnv('DISCORD_TOKEN') : process.env.DISCORD_TOKEN ?? null;
  const discordClientId = requireDiscord
    ? requireEnv('DISCORD_CLIENT_ID')
    : process.env.DISCORD_CLIENT_ID ?? null;
  const discordGuildId = requireGuildId ? requireEnv('DISCORD_GUILD_ID') : process.env.DISCORD_GUILD_ID ?? null;

  return {
    discordToken,
    discordClientId,
    discordGuildId,
    commandPrefix: parseCommandPrefix(process.env.COMMAND_PREFIX),
    databasePath: process.env.DATABASE_PATH ?? 'database/brainrot.sqlite',
    logLevel: parseLogLevel(process.env.LOG_LEVEL)
  };
}
