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

CREATE INDEX IF NOT EXISTS idx_player_wishes_player_id ON player_wishes(player_id);
CREATE INDEX IF NOT EXISTS idx_player_wishes_brainrot_id ON player_wishes(brainrot_id);
CREATE INDEX IF NOT EXISTS idx_player_favorites_player_id ON player_favorites(player_id);
CREATE INDEX IF NOT EXISTS idx_player_favorites_brainrot_id ON player_favorites(brainrot_id);
