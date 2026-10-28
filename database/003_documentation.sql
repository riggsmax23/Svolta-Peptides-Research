CREATE TABLE IF NOT EXISTS batches (
 number TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id),
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS reports (
 id TEXT PRIMARY KEY, batch_number TEXT NOT NULL REFERENCES batches(number),
 content TEXT NOT NULL CHECK(json_valid(content)), pdf BLOB NOT NULL, sha256 TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('draft','published','withdrawn')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS reports_batch ON reports(batch_number);
INSERT OR IGNORE INTO migrations(version) VALUES(3);
