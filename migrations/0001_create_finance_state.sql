CREATE TABLE IF NOT EXISTS finance_state (
  id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
  state_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  last_saved_at TEXT
);
