import { getDb } from "./db";
import type { SyncQueueItem } from "@/lib/models/sync";

/**
 * Enqueue a sync item for pending mutations
 */
export async function enqueueSyncItem(item: SyncQueueItem): Promise<void> {
  const db = await getDb();
  const bodyStr = item.body ? JSON.stringify(item.body) : null;

  await db.runAsync(
    `INSERT INTO sync_queue (id, createdAt, attemptCount, status, method, path, body, entityType, entityId, lastError)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    item.id,
    item.createdAt,
    item.attemptCount,
    item.status,
    item.method,
    item.path,
    bodyStr,
    item.entityType,
    item.entityId,
    item.lastError ?? null
  );
}

/**
 * Get a single sync queue item by id
 */
export async function getSyncItem(id: string): Promise<SyncQueueItem | null> {
  const db = await getDb();

  const row = await db.getFirstAsync<{
    id: string;
    createdAt: string;
    attemptCount: number;
    status: string;
    method: string;
    path: string;
    body: string | null;
    entityType: string;
    entityId: string;
    lastError: string | null;
  }>(
    `SELECT id, createdAt, attemptCount, status, method, path, body, entityType, entityId, lastError
     FROM sync_queue WHERE id = ?`,
    id
  );

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    createdAt: row.createdAt,
    attemptCount: row.attemptCount,
    status: row.status as "pending" | "error",
    method: row.method as "POST" | "PATCH" | "DELETE",
    path: row.path,
    body: row.body ? JSON.parse(row.body) : null,
    entityType: row.entityType,
    entityId: row.entityId,
    lastError: row.lastError ?? undefined,
  };
}

/**
 * List all pending sync items ordered by createdAt ASC
 */
export async function listPendingSyncItems(): Promise<SyncQueueItem[]> {
  const db = await getDb();

  const rows = await db.getAllAsync<{
    id: string;
    createdAt: string;
    attemptCount: number;
    status: string;
    method: string;
    path: string;
    body: string | null;
    entityType: string;
    entityId: string;
    lastError: string | null;
  }>(
    `SELECT id, createdAt, attemptCount, status, method, path, body, entityType, entityId, lastError
     FROM sync_queue
     ORDER BY createdAt ASC, rowid ASC`
  );

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    attemptCount: row.attemptCount,
    status: row.status as "pending" | "error",
    method: row.method as "POST" | "PATCH" | "DELETE",
    path: row.path,
    body: row.body ? JSON.parse(row.body) : null,
    entityType: row.entityType,
    entityId: row.entityId,
    lastError: row.lastError ?? undefined,
  }));
}

/**
 * Update a sync item with a patch (partial update)
 */
export async function updateSyncItem(
  itemId: string,
  patch: Partial<{
    attemptCount: number;
    status: "pending" | "error";
    lastError: string | null;
  }>
): Promise<void> {
  const db = await getDb();

  const updates: string[] = [];
  const values: unknown[] = [];

  if (patch.attemptCount !== undefined) {
    updates.push("attemptCount = ?");
    values.push(patch.attemptCount);
  }

  if (patch.status !== undefined) {
    updates.push("status = ?");
    values.push(patch.status);
  }

  if (patch.lastError !== undefined) {
    updates.push("lastError = ?");
    values.push(patch.lastError);
  }

  if (updates.length === 0) {
    return;
  }

  values.push(itemId);

  await db.runAsync(
    `UPDATE sync_queue SET ${updates.join(", ")} WHERE id = ?`,
    ...(values as Parameters<typeof db.runAsync>[1][])
  );
}

/**
 * Delete a sync queue item by id
 */
export async function deleteSyncItem(id: string): Promise<void> {
  const db = await getDb();

  await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, id);
}

/**
 * Delete all sync queue items for a given entity
 */
export async function deleteSyncItemsByEntity(
  entityType: string,
  entityId: string
): Promise<void> {
  const db = await getDb();

  await db.runAsync(
    `DELETE FROM sync_queue WHERE entityType = ? AND entityId = ?`,
    entityType, entityId
  );
}
