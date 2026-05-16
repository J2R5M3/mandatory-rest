-- schema.sql

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    title TEXT,
    duration_mins INTEGER,
    window_start TEXT,
    window_end TEXT,
    timer_deadline TEXT,
    interval_days INTEGER DEFAULT 7,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_timer_deadline ON sessions(timer_deadline);

CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    email TEXT,
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tokens (
    id TEXT PRIMARY KEY,
    participant_id TEXT,
    provider TEXT,
    refresh_token TEXT,
    is_primary INTEGER CHECK (is_primary IN (0, 1)),
    FOREIGN KEY(participant_id) REFERENCES participants(id) ON DELETE CASCADE
);
