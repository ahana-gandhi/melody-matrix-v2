import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";

const dbPath = path.resolve(process.cwd(), "melody-matrix.db");
const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// Run migrations inline (create tables if they don't exist)
// Drop old users table if it has the legacy email schema
const cols = sqlite.prepare("PRAGMA table_info(users)").all() as { name: string }[];
if (cols.length > 0 && !cols.find(c => c.name === "username")) {
  sqlite.exec("DROP TABLE IF EXISTS users;");
}

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS mood_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    issue TEXT NOT NULL,
    instrument TEXT NOT NULL,
    tempo INTEGER NOT NULL,
    intensity_scores TEXT NOT NULL,
    prompt_used TEXT NOT NULL,
    mood_before INTEGER,
    mood_after INTEGER,
    notes TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    mood INTEGER NOT NULL,
    energy INTEGER NOT NULL,
    note TEXT,
    tags TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);
