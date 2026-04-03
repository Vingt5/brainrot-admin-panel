# Brainrot Admin Panel

Repo maitre pour l'interface admin visuelle et le bot `brainrot-bot`.

## Structure

```text
brainrot-admin-panel/
|- src/                  # frontend Lovable / React
|- public/
|- supabase/             # artefacts Lovable existants
`- bot/                  # bot Discord existant importe tel quel
   |- src/
   |- data/
   |- database/
   |- tests/
   `- package.json
```

## Roles

- La racine du repo sert au frontend admin genere par Lovable.
- Le dossier `bot/` contient le bot Discord existant, sa DB locale, ses seeds et ses tests.
- La future API admin devra vivre dans `bot/` pour rester au plus pres de la source de verite du bot.

## Installation

Frontend :

```bash
npm install
```

Bot :

```bash
npm --prefix bot install
```

## Commandes utiles

Frontend Lovable :

```bash
npm run dev
npm run build
npm run test
```

Bot :

```bash
npm run bot:dev
npm run bot:build
npm run bot:test
npm run bot:start
```

Equivalent direct si besoin :

```bash
npm --prefix bot run dev
npm --prefix bot run build
npm --prefix bot run test
npm --prefix bot run start
```

## Notes

- Les secrets du bot restent dans `bot/.env` et ne sont pas versionnes.
- Les fichiers SQLite locaux de `bot/database/` ne sont pas versionnes.
- Les artefacts runtime du bot (`bot/output/`, `bot/dist/`, logs locaux) ne sont pas versionnes.
- Le catalogue brainrot reste pilote par `bot/data/brainrots.seed.json` et les scripts du bot.
