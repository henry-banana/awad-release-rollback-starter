ALTER TABLE links ADD COLUMN expires_at INTEGER;

CREATE TABLE feature_flags (
  name TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL CHECK (enabled IN (0, 1))
);
INSERT INTO feature_flags (name, enabled) VALUES ('expiry', 0);
