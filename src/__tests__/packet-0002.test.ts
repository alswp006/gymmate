import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as SQLite from "expo-sqlite";
import { initDb, getDb } from "@/lib/storage/db";
import {
  upsertEntity,
  getEntity,
  listEntities,
  deleteEntity,
  deleteEntitiesByType,
} from "@/lib/storage/entitiesRepo";
import {
  enqueueSyncItem,
  getSyncItem,
  listPendingSyncItems,
  updateSyncItem,
  deleteSyncItem,
  deleteSyncItemsByEntity,
} from "@/lib/storage/syncQueueRepo";
import type { SyncQueueItem } from "@/lib/models/sync";
import { createUuid } from "@/lib/uuid";

let db: SQLite.SQLiteDatabase;

beforeEach(async () => {
  // Initialize DB for each test
  db = await initDb();

  // Clean up tables
  await db.execAsync("DELETE FROM entities");
  await db.execAsync("DELETE FROM sync_queue");
});

afterEach(async () => {
  // Clean up after each test
  await db.execAsync("DELETE FROM entities");
  await db.execAsync("DELETE FROM sync_queue");
});

describe("Database Initialization", () => {
  it("should initialize database and create tables", async () => {
    const database = await initDb();
    expect(database).toBeDefined();
  });

  it("should handle multiple consecutive initDb() calls without throwing", async () => {
    const db1 = await initDb();
    const db2 = await initDb();

    expect(db1).toBeDefined();
    expect(db2).toBeDefined();
    expect(db1).toBe(db2); // Should return same instance
  });

  it("should return same instance from getDb() after init", async () => {
    await initDb();
    const db1 = await getDb();
    const db2 = await getDb();

    expect(db1).toBe(db2);
  });
});

describe("Entities Repository", () => {
  it("should insert and retrieve an entity", async () => {
    const entityType = "workout";
    const id = createUuid();
    const json = { name: "Chest Day", exercises: 5 };
    const updatedAt = new Date().toISOString();

    await upsertEntity(entityType, id, json, updatedAt, "pending");

    const entity = await getEntity(entityType, id);
    expect(entity).toBeDefined();
    expect(entity!.id).toBe(id);
    expect(entity!.entityType).toBe(entityType);
    expect(entity!.json).toEqual(json); // Deep equality
    expect(entity!.syncStatus).toBe("pending");
  });

  it("should replace entity on second upsert", async () => {
    const entityType = "workout";
    const id = createUuid();
    const json1 = { name: "Chest Day" };
    const json2 = { name: "Back Day" };

    const time1 = new Date(Date.now() - 1000).toISOString();
    const time2 = new Date().toISOString();

    await upsertEntity(entityType, id, json1, time1, "pending");
    await upsertEntity(entityType, id, json2, time2, "synced");

    const entity = await getEntity(entityType, id);
    expect(entity!.json).toEqual(json2);
    expect(entity!.syncStatus).toBe("synced");
    expect(entity!.updatedAt).toBe(time2);
  });

  it("should preserve createdAt on upsert", async () => {
    const entityType = "workout";
    const id = createUuid();

    await upsertEntity(
      entityType,
      id,
      { name: "Day 1" },
      new Date().toISOString(),
      "pending"
    );
    const first = await getEntity(entityType, id);
    const firstCreatedAt = first!.createdAt;

    // Wait a moment and upsert again
    await new Promise((resolve) => setTimeout(resolve, 10));
    await upsertEntity(
      entityType,
      id,
      { name: "Day 2" },
      new Date().toISOString(),
      "pending"
    );
    const second = await getEntity(entityType, id);

    expect(second!.createdAt).toBe(firstCreatedAt);
  });

  it("should return null for non-existent entity", async () => {
    const entity = await getEntity("workout", "non-existent");
    expect(entity).toBeNull();
  });

  it("should list entities sorted by updatedAt DESC", async () => {
    const entityType = "workout";
    const ids = [createUuid(), createUuid(), createUuid()];

    // Insert with different timestamps
    const times = [
      new Date(Date.now() - 2000).toISOString(),
      new Date(Date.now() - 1000).toISOString(),
      new Date().toISOString(),
    ];

    await upsertEntity(entityType, ids[0], { order: 1 }, times[0], "pending");
    await upsertEntity(entityType, ids[1], { order: 2 }, times[1], "pending");
    await upsertEntity(entityType, ids[2], { order: 3 }, times[2], "pending");

    const entities = await listEntities(entityType);

    expect(entities).toHaveLength(3);
    expect(entities[0].id).toBe(ids[2]); // Most recent first
    expect(entities[1].id).toBe(ids[1]);
    expect(entities[2].id).toBe(ids[0]); // Oldest last
  });

  it("should list entities of specific type only", async () => {
    const id1 = createUuid();
    const id2 = createUuid();

    await upsertEntity("workout", id1, { type: "w1" }, new Date().toISOString(), "pending");
    await upsertEntity("profile", id2, { type: "p1" }, new Date().toISOString(), "pending");

    const workouts = await listEntities("workout");
    const profiles = await listEntities("profile");

    expect(workouts).toHaveLength(1);
    expect(workouts[0].entityType).toBe("workout");
    expect(profiles).toHaveLength(1);
    expect(profiles[0].entityType).toBe("profile");
  });

  it("should delete an entity", async () => {
    const entityType = "workout";
    const id = createUuid();

    await upsertEntity(entityType, id, { name: "Test" }, new Date().toISOString(), "pending");
    await deleteEntity(entityType, id);

    const entity = await getEntity(entityType, id);
    expect(entity).toBeNull();
  });

  it("should delete all entities of a type", async () => {
    const workoutIds = [createUuid(), createUuid()];
    const profileId = createUuid();

    await upsertEntity("workout", workoutIds[0], {}, new Date().toISOString(), "pending");
    await upsertEntity("workout", workoutIds[1], {}, new Date().toISOString(), "pending");
    await upsertEntity("profile", profileId, {}, new Date().toISOString(), "pending");

    await deleteEntitiesByType("workout");

    const workouts = await listEntities("workout");
    const profiles = await listEntities("profile");

    expect(workouts).toHaveLength(0);
    expect(profiles).toHaveLength(1);
  });
});

describe("Sync Queue Repository", () => {
  it("should enqueue and retrieve a sync item", async () => {
    const item: SyncQueueItem = {
      id: createUuid(),
      createdAt: new Date().toISOString(),
      attemptCount: 0,
      status: "pending",
      method: "POST",
      path: "/api/workouts",
      body: { name: "Chest Day" },
      entityType: "workout",
      entityId: createUuid(),
    };

    await enqueueSyncItem(item);

    const retrieved = await getSyncItem(item.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe(item.id);
    expect(retrieved!.body).toEqual(item.body);
    expect(retrieved!.method).toBe("POST");
  });

  it("should list pending sync items ordered by createdAt ASC", async () => {
    const items: SyncQueueItem[] = [
      {
        id: createUuid(),
        createdAt: new Date(Date.now() - 2000).toISOString(),
        attemptCount: 0,
        status: "pending",
        method: "POST",
        path: "/api/workouts",
        body: { order: 1 },
        entityType: "workout",
        entityId: createUuid(),
      },
      {
        id: createUuid(),
        createdAt: new Date(Date.now() - 1000).toISOString(),
        attemptCount: 0,
        status: "pending",
        method: "POST",
        path: "/api/workouts",
        body: { order: 2 },
        entityType: "workout",
        entityId: createUuid(),
      },
      {
        id: createUuid(),
        createdAt: new Date().toISOString(),
        attemptCount: 0,
        status: "pending",
        method: "POST",
        path: "/api/workouts",
        body: { order: 3 },
        entityType: "workout",
        entityId: createUuid(),
      },
    ];

    for (const item of items) {
      await enqueueSyncItem(item);
    }

    const pending = await listPendingSyncItems();

    expect(pending).toHaveLength(3);
    expect(pending[0].id).toBe(items[0].id); // Oldest first
    expect(pending[1].id).toBe(items[1].id);
    expect(pending[2].id).toBe(items[2].id); // Most recent last
  });

  it("should update sync item fields", async () => {
    const item: SyncQueueItem = {
      id: createUuid(),
      createdAt: new Date().toISOString(),
      attemptCount: 0,
      status: "pending",
      method: "POST",
      path: "/api/workouts",
      body: null,
      entityType: "workout",
      entityId: createUuid(),
    };

    await enqueueSyncItem(item);

    await updateSyncItem(item.id, {
      attemptCount: 1,
      status: "error",
      lastError: "Network timeout",
    });

    const updated = await getSyncItem(item.id);
    expect(updated!.attemptCount).toBe(1);
    expect(updated!.status).toBe("error");
    expect(updated!.lastError).toBe("Network timeout");
  });

  it("should update only specified fields", async () => {
    const item: SyncQueueItem = {
      id: createUuid(),
      createdAt: new Date().toISOString(),
      attemptCount: 0,
      status: "pending",
      method: "POST",
      path: "/api/workouts",
      body: null,
      entityType: "workout",
      entityId: createUuid(),
    };

    await enqueueSyncItem(item);

    await updateSyncItem(item.id, { attemptCount: 2 });

    const updated = await getSyncItem(item.id);
    expect(updated!.attemptCount).toBe(2);
    expect(updated!.status).toBe("pending"); // Unchanged
  });

  it("should delete a sync item", async () => {
    const item: SyncQueueItem = {
      id: createUuid(),
      createdAt: new Date().toISOString(),
      attemptCount: 0,
      status: "pending",
      method: "POST",
      path: "/api/workouts",
      body: null,
      entityType: "workout",
      entityId: createUuid(),
    };

    await enqueueSyncItem(item);
    await deleteSyncItem(item.id);

    const retrieved = await getSyncItem(item.id);
    expect(retrieved).toBeNull();
  });

  it("should delete all sync items for an entity", async () => {
    const entityId = createUuid();

    const item1: SyncQueueItem = {
      id: createUuid(),
      createdAt: new Date().toISOString(),
      attemptCount: 0,
      status: "pending",
      method: "POST",
      path: "/api/workouts",
      body: null,
      entityType: "workout",
      entityId,
    };

    const item2: SyncQueueItem = {
      id: createUuid(),
      createdAt: new Date().toISOString(),
      attemptCount: 0,
      status: "pending",
      method: "POST",
      path: "/api/workouts",
      body: null,
      entityType: "workout",
      entityId,
    };

    const otherItem: SyncQueueItem = {
      id: createUuid(),
      createdAt: new Date().toISOString(),
      attemptCount: 0,
      status: "pending",
      method: "POST",
      path: "/api/profiles",
      body: null,
      entityType: "profile",
      entityId: createUuid(),
    };

    await enqueueSyncItem(item1);
    await enqueueSyncItem(item2);
    await enqueueSyncItem(otherItem);

    await deleteSyncItemsByEntity("workout", entityId);

    const pending = await listPendingSyncItems();
    expect(pending).toHaveLength(1);
    expect(pending[0].id).toBe(otherItem.id);
  });

  it("should handle null body in sync items", async () => {
    const item: SyncQueueItem = {
      id: createUuid(),
      createdAt: new Date().toISOString(),
      attemptCount: 0,
      status: "pending",
      method: "DELETE",
      path: "/api/workouts/123",
      body: null,
      entityType: "workout",
      entityId: createUuid(),
    };

    await enqueueSyncItem(item);

    const retrieved = await getSyncItem(item.id);
    expect(retrieved!.body).toBeNull();
  });

  it("should handle complex body objects", async () => {
    const complexBody = {
      nested: { deep: { value: 42 } },
      array: [1, 2, 3],
      bool: true,
      null: null,
    };

    const item: SyncQueueItem = {
      id: createUuid(),
      createdAt: new Date().toISOString(),
      attemptCount: 0,
      status: "pending",
      method: "PATCH",
      path: "/api/workouts/123",
      body: complexBody,
      entityType: "workout",
      entityId: createUuid(),
    };

    await enqueueSyncItem(item);

    const retrieved = await getSyncItem(item.id);
    expect(retrieved!.body).toEqual(complexBody);
  });
});
