/// <reference types="node" />
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

const dbSync = new DatabaseSync(":memory:");

export class SQLiteDatabase {
  async execAsync(sql: string): Promise<void> {
    dbSync.exec(sql);
  }

  async runAsync(
    sql: string,
    ...params: SQLInputValue[]
  ): Promise<{ changes: number; lastInsertRowId: number }> {
    const stmt = dbSync.prepare(sql);
    const result = stmt.run(...params);
    return {
      changes: Number(result.changes),
      lastInsertRowId: Number(result.lastInsertRowid),
    };
  }

  async getFirstAsync<T>(
    sql: string,
    ...params: SQLInputValue[]
  ): Promise<T | null> {
    const stmt = dbSync.prepare(sql);
    const row = stmt.get(...params);
    return (row as T | undefined) ?? null;
  }

  async getAllAsync<T>(
    sql: string,
    ...params: SQLInputValue[]
  ): Promise<T[]> {
    const stmt = dbSync.prepare(sql);
    return stmt.all(...params) as T[];
  }
}

const instance = new SQLiteDatabase();

export async function openDatabaseAsync(
  _name: string
): Promise<SQLiteDatabase> {
  return instance;
}
