import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function initDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  db = await SQLite.openDatabaseAsync("gymmate.db");

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS entities (
      id TEXT NOT NULL,
      entityType TEXT NOT NULL,
      json TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncStatus TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL,
      PRIMARY KEY (entityType, id)
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      createdAt TEXT NOT NULL,
      attemptCount INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      body TEXT,
      entityType TEXT NOT NULL,
      entityId TEXT NOT NULL,
      lastError TEXT
    );
  `);

  return db;
}

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    return initDb();
  }
  return db;
}
