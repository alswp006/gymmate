import { getDb } from "./db";
import type { SyncStatus } from "@/lib/types";

export interface Entity {
  id: string;
  entityType: string;
  json: unknown;
  updatedAt: string;
  syncStatus: SyncStatus;
  createdAt: string;
}

/**
 * Insert or replace an entity in the entities table
 */
export async function upsertEntity(
  entityType: string,
  id: string,
  json: unknown,
  updatedAt: string,
  syncStatus: SyncStatus
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  const jsonStr = JSON.stringify(json);

  await db.runAsync(
    `INSERT OR REPLACE INTO entities (id, entityType, json, updatedAt, syncStatus, createdAt)
     VALUES (?, ?, ?, ?, ?, COALESCE((SELECT createdAt FROM entities WHERE entityType = ? AND id = ?), ?))`,
    id, entityType, jsonStr, updatedAt, syncStatus, entityType, id, now
  );
}

/**
 * Get a single entity by entityType and id
 */
export async function getEntity(
  entityType: string,
  id: string
): Promise<Entity | null> {
  const db = await getDb();

  const row = await db.getFirstAsync<{
    id: string;
    entityType: string;
    json: string;
    updatedAt: string;
    syncStatus: string;
    createdAt: string;
  }>(
    `SELECT id, entityType, json, updatedAt, syncStatus, createdAt FROM entities
     WHERE entityType = ? AND id = ?`,
    entityType, id
  );

  if (!row) {
    return null;
  }

  return {
    ...row,
    json: JSON.parse(row.json),
    syncStatus: row.syncStatus as SyncStatus,
  };
}

/**
 * List all entities of a given type, sorted by updatedAt DESC
 */
export async function listEntities(entityType: string): Promise<Entity[]> {
  const db = await getDb();

  const rows = await db.getAllAsync<{
    id: string;
    entityType: string;
    json: string;
    updatedAt: string;
    syncStatus: string;
    createdAt: string;
  }>(
    `SELECT id, entityType, json, updatedAt, syncStatus, createdAt FROM entities
     WHERE entityType = ?
     ORDER BY updatedAt DESC, rowid DESC`,
    entityType
  );

  return rows.map((row) => ({
    ...row,
    json: JSON.parse(row.json),
    syncStatus: row.syncStatus as SyncStatus,
  }));
}

/**
 * Delete an entity by entityType and id
 */
export async function deleteEntity(
  entityType: string,
  id: string
): Promise<void> {
  const db = await getDb();

  await db.runAsync(
    `DELETE FROM entities WHERE entityType = ? AND id = ?`,
    entityType, id
  );
}

/**
 * Delete all entities of a given type
 */
export async function deleteEntitiesByType(entityType: string): Promise<void> {
  const db = await getDb();

  await db.runAsync(`DELETE FROM entities WHERE entityType = ?`, entityType);
}
