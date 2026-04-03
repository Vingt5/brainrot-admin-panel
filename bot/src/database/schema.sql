CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_user_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  global_name TEXT,
  last_roll_at TEXT,
  last_claim_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS guilds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_guild_id TEXT NOT NULL UNIQUE,
  configured_channel_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS player_guilds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  guild_id INTEGER NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  last_seen_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (player_id, guild_id)
);

CREATE TABLE IF NOT EXISTS brainrots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic')),
  image_url TEXT NOT NULL,
  description TEXT NOT NULL,
  source_status TEXT NOT NULL CHECK (source_status IN ('canon', 'popular_variant', 'uncertain')),
  aliases_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS player_brainrots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  brainrot_id INTEGER NOT NULL REFERENCES brainrots(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  first_obtained_at TEXT NOT NULL,
  last_obtained_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (player_id, brainrot_id)
);

CREATE TABLE IF NOT EXISTS player_wishes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  brainrot_id INTEGER NOT NULL REFERENCES brainrots(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (player_id, brainrot_id)
);

CREATE TABLE IF NOT EXISTS player_favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  brainrot_id INTEGER NOT NULL REFERENCES brainrots(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (player_id, brainrot_id)
);

CREATE TABLE IF NOT EXISTS active_rolls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id INTEGER NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  message_id TEXT,
  brainrot_id INTEGER NOT NULL REFERENCES brainrots(id) ON DELETE CASCADE,
  rolled_by_player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'claimed', 'expired')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  claimed_by_player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
  claimed_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_brainrots_rarity ON brainrots(rarity);
CREATE INDEX IF NOT EXISTS idx_player_brainrots_player_id ON player_brainrots(player_id);
CREATE INDEX IF NOT EXISTS idx_player_brainrots_last_obtained_at ON player_brainrots(last_obtained_at);
CREATE INDEX IF NOT EXISTS idx_player_wishes_player_id ON player_wishes(player_id);
CREATE INDEX IF NOT EXISTS idx_player_wishes_brainrot_id ON player_wishes(brainrot_id);
CREATE INDEX IF NOT EXISTS idx_player_favorites_player_id ON player_favorites(player_id);
CREATE INDEX IF NOT EXISTS idx_player_favorites_brainrot_id ON player_favorites(brainrot_id);
CREATE INDEX IF NOT EXISTS idx_player_guilds_guild_id ON player_guilds(guild_id);
CREATE INDEX IF NOT EXISTS idx_active_rolls_expires_at ON active_rolls(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_rolls_message_id
  ON active_rolls(message_id)
  WHERE message_id IS NOT NULL;
