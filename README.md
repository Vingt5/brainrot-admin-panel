# Brainrot Admin Panel

Monorepo local pour administrer visuellement le bot `brainrot-bot`.

## Structure

```text
brainrot-admin-panel/
|- src/                  # frontend React / Vite / shadcn
|- public/
|- supabase/             # artefacts Lovable conserves
`- bot/
   |- src/               # bot Discord existant
   |- src-admin/         # API admin Express locale
   |- data/              # source de verite du catalogue
   |- database/          # SQLite locale
   |- output/            # logs runtime et historique maintenance
   |- tests/
   `- package.json
```

## Architecture

- Le frontend admin vit a la racine du repo.
- L'API admin vit dans `bot/src-admin/`.
- Le bot Discord reste dans `bot/src/`.
- Le frontend ne parle jamais directement a SQLite.
- Le frontend appelle l'API admin.
- L'API admin lit la meme SQLite que le bot et peut lancer le bot localement.

## Conventions du repo

- Les evolutions UI se font a la racine : `src/`, `public/`, `package.json`.
- Les evolutions bot et API se font uniquement dans `bot/`.
- `bot/src/` reste le coeur gameplay Discord.
- `bot/src-admin/` reste la seule couche HTTP/admin.
- `supabase/` est un artefact Lovable conserve, pas la source backend du projet.

## Variables d'environnement

### Frontend admin

Fichier local recommande : `.env.local`

```env
VITE_ADMIN_API_URL=http://127.0.0.1:8787
VITE_ADMIN_API_TOKEN=your-local-admin-token
```

### Bot + API admin

Fichier local : `bot/.env`

Variables bot :

```env
DISCORD_TOKEN=...
DISCORD_CLIENT_ID=...
DISCORD_GUILD_ID=...
DATABASE_PATH=database/brainrot.sqlite
LOG_LEVEL=info
```

Variables API admin :

```env
ADMIN_API_HOST=127.0.0.1
ADMIN_API_PORT=8787
ADMIN_FRONTEND_ORIGIN=http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:8080,http://localhost:8080
ADMIN_API_TOKEN=change-me-local-token
```

## Installation

Frontend admin :

```bash
npm install
```

Bot + API admin :

```bash
npm --prefix bot install
```

## Commandes

Frontend admin :

```bash
npm run panel:dev
npm run panel:build
npm run test
```

API admin :

```bash
npm run admin-api:dev
npm run admin-api:build
npm run admin-api:start
```

Bot Discord :

```bash
npm run bot:dev
npm run bot:build
npm run bot:test
npm run bot:start
```

Equivalent direct si besoin :

```bash
npm --prefix bot run admin-api:dev
npm --prefix bot run admin-api:start
npm --prefix bot run dev
npm --prefix bot run start
```

## Flux recommande

1. Lance l'API admin.
2. Lance le frontend admin.
3. Ouvre la page Runtime.
4. Demarre ou redemarre le bot depuis le panel.

## Pages V1 branchees

- Dashboard : KPI live, sante des donnees, rolls recents, status runtime.
- Players : liste live, recherche, drawer detail, stats et inventaire.
- Brainrots : catalogue live, filtre par rarete, drawer detail.
- Rolls : table live, filtre de statut, pagination et drawer detail.
- Runtime : start / stop / restart, migrations, maintenance whitelist, historique des taches.

## Actions runtime / maintenance

Runtime local :

- `start`
- `stop`
- `restart`

Maintenance whitelist :

- `db:init`
- `db:seed`
- `assets:sync`
- `catalog:generate`
- `deploy:commands`

## Limites V1

- Controle runtime local uniquement. Pas de remote management.
- Les pages `Guilds`, `Inventories`, `Leaderboards`, `Wishes / Favorites` ne sont pas encore exposees dans la navigation frontend, meme si plusieurs endpoints sont deja poses cote API.
- Le catalogue reste `seed-managed` : le panel affiche la verite live mais n'edite pas encore `bot/data/brainrots.seed.json`.
- Si le port Vite par defaut est deja pris, le frontend peut demarrer sur un autre port local.

## Notes

- Les secrets du bot restent dans `bot/.env` et ne sont pas versionnes.
- Les fichiers SQLite locaux de `bot/database/` ne sont pas versionnes.
- Les artefacts runtime (`bot/output/`, `bot/dist/`, logs locaux) ne sont pas versionnes.
- Le catalogue brainrot reste pilote par `bot/data/brainrots.seed.json` et les scripts du bot.
