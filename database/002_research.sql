CREATE TABLE IF NOT EXISTS research_articles (
  product_id TEXT PRIMARY KEY REFERENCES products(id),
  content TEXT NOT NULL CHECK(json_valid(content)),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version > 0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO migrations(version) VALUES(2);
