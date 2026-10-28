CREATE TABLE IF NOT EXISTS site_documents (
 slug TEXT PRIMARY KEY, draft TEXT NOT NULL CHECK(json_valid(draft)), published TEXT CHECK(published IS NULL OR json_valid(published)), version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS site_revisions (
 id INTEGER PRIMARY KEY, slug TEXT NOT NULL REFERENCES site_documents(slug), content TEXT NOT NULL CHECK(json_valid(content)), actor_id TEXT NOT NULL REFERENCES admins(id), operation TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS product_categories (name TEXT PRIMARY KEY, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO product_categories(name) VALUES('Single compound'),('Research blend');
INSERT OR IGNORE INTO migrations(version) VALUES(6);
CREATE TABLE IF NOT EXISTS admin_access(admin_id TEXT PRIMARY KEY REFERENCES admins(id),active INTEGER NOT NULL DEFAULT 1,version INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS order_reviews(id TEXT PRIMARY KEY,order_id TEXT NOT NULL REFERENCES test_orders(id),kind TEXT NOT NULL CHECK(kind IN ('damaged','incorrect','defective','other')),resolution TEXT NOT NULL CHECK(resolution IN ('review_pending','simulated_replacement','simulated_refund','declined')),notes TEXT NOT NULL,actor_id TEXT NOT NULL REFERENCES admins(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
