# Brainrot Bot

Bot Discord de collection en `Node.js + TypeScript + discord.js + SQLite`.

## Stack

- Node.js 20+
- TypeScript
- discord.js
- SQLite via `better-sqlite3`

## Installation

```bash
npm install
```

## Configuration

Copier `.env.example` vers `.env` puis renseigner les variables Discord.

```env
DISCORD_TOKEN=votre-token-bot-discord
DISCORD_CLIENT_ID=votre-client-id-discord
DISCORD_GUILD_ID=votre-serveur-de-developpement
COMMAND_PREFIX=%
DATABASE_PATH=database/brainrot.sqlite
LOG_LEVEL=info
```

## Initialisation de la base

```bash
npm run db:init
npm run db:seed
```

Scripts utiles pour le catalogue et les assets :

```bash
npm run catalog:generate
npm run assets:sync
```

## Lancement

Developpement :

```bash
npm run dev
```

Build :

```bash
npm run build
```

Execution du build :

```bash
npm run start
```

## Tests

```bash
npm test
```

## Scripts disponibles

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm test`
- `npm run deploy:commands`
- `npm run catalog:generate`
- `npm run assets:sync`
- `npm run db:init`
- `npm run db:seed`
