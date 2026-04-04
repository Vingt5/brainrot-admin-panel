import dotenv from 'dotenv';

import { loadEnv, type AppEnv } from '../src/config/env.js';

dotenv.config();

export interface AdminEnv {
  appEnv: AppEnv;
  host: string;
  port: number;
  allowedOrigins: string[];
  apiToken: string | null;
}

function parsePort(value: string | undefined): number {
  if (!value) {
    return 8787;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`ADMIN_API_PORT invalide : ${value}`);
  }

  return port;
}

function parseOrigins(value: string | undefined): string[] {
  if (!value) {
    return [
      'http://127.0.0.1:5173',
      'http://localhost:5173',
      'http://127.0.0.1:8080',
      'http://localhost:8080',
      'http://127.0.0.1:4173',
      'http://localhost:4173'
    ];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function loadAdminEnv(): AdminEnv {
  return {
    appEnv: loadEnv({ requireDiscord: false, requireGuildId: false }),
    host: process.env.ADMIN_API_HOST?.trim() || '127.0.0.1',
    port: parsePort(process.env.ADMIN_API_PORT),
    allowedOrigins: parseOrigins(process.env.ADMIN_FRONTEND_ORIGIN),
    apiToken: process.env.ADMIN_API_TOKEN?.trim() || null
  };
}
