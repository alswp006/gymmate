# TASKS

## Epic 1. Data Layer (models + local storage + stores)

### Task 1.1 Define shared sync + timestamp types
- Description: Add base types used by all offline-first entities (syncStatus, ISO timestamps, API error shape).
- DoD:
  - `SyncStatus` union type is exported.
  - `IsoDateString` / `IsoDateTimeString` types exist (string aliases).
  - `ApiErrorResponse` type matches `{ error: string; details?: any }`.
  - TypeScript strict passes.
- Covers: [F8-AC1]
- Files:  
  - `src/lib/types.ts`
- Depends on: none

### Task 1.2 Add UUID helper
- Description: Create a single helper to generate IDs for locally-created entities.
- DoD:
  - `createUuid()` returns a non-empty string.
  - No screen changes required; app compiles.
- Covers: [F1-AC1, F2-AC1, F5-AC3, F6-AC1, F8-AC1]
- Files:
  - `src/lib/uuid.ts`
- Depends on: Task 1.1

### Task 1.3 Define OnboardingProfile model + validator
- Description: Add the `OnboardingProfile` type and a pure validation function for goal/height/weight.
- DoD:
  - `validateOnboardingProfileInput()` returns `{ ok: true }` OR `{ ok: false; fieldErrors: Record<string,string> }`.
  - Height validation enforces `< 80` or `> 250` invalid.
  - Weight validation enforces `< 20` or `> 300` invalid.
- Covers: [F1-AC4]
- Files:
  - `src/lib/models/onboardingProfile.ts`
- Depends on: Task 1.1

### Task 1.4 Define Workout models (session/exercise/set/cardio) minimal fields
- Description: Add TypeScript models needed by workout logging + offline sync status.
- DoD:
  - Exports types: `WorkoutSession`, `ExerciseEntry`, `SetEntry`, `CardioEntry`.
  - Fields included at minimum for UI + API: ids, foreign keys, startedAt/date, order, setNumber, weights/reps, restPlannedSec, completedAt, totals, createdAt/updatedAt, syncStatus.
- Covers: [F2-AC1, F2-AC3, F2-AC4, F2-AC8]
- Files:
  - `src/lib/models/workouts.ts`
- Depends on: Task 1.1

### Task 1.5 Define Feed + Challenge + Stats models minimal fields
- Description: Add types for feed, likes, comments, challenges, leaderboard participants, weekly stats + personal records.
- DoD:
  - Exports types: `FeedItem`, `FeedReaction`, `FeedComment`, `Challenge`, `ChallengeParticipant`, `PersonalRecord`, `WeeklyVolumeMap`.
- Covers: [F5-AC1, F6-AC1, F7-AC1, F7-AC2]
- Files:
  - `src/lib/models/social.ts`
  - `src/lib/models/stats.ts`
- Depends on: Task 1.1

### Task 1.6 Add sync queue item model
- Description: Define a local `SyncQueueItem` type to represent pending API mutations.
- DoD:
  - `SyncQueueItem` includes: `id`, `createdAt`, `attemptCount`, `status: "pending"|"error"`, `method`, `path`, `body`, `entityType`, `entityId`, `lastError?`.
- Covers: [F8-AC1, F8-AC5]
- Files:
  - `src/lib/models/sync.ts`
- Depends on: Task 1.1

### Task 1.7 Add SQLite wrapper + initialization (Expo SQLite)
- Description: Create a minimal SQLite helper to open DB and run init statements.
- DoD:
  - `getDb()` returns an opened db instance.
  - `initDb()` can be called repeatedly without throwing.
  - App compiles even if `initDb()` isn’t called yet.
- Covers: [F8-AC1]
- Files:
  - `src/lib/storage/db.ts`
- Depends on: Task 1.1

### Task 1.8 Create generic JSON entity table storage
- Description: Implement a generic table `entities` storing `{ entityType, id, json, updatedAt, syncStatus }` with CRUD helpers.
- DoD:
  - `upsertEntity(entityType, id, json, updatedAt, syncStatus)` inserts or replaces.
  - `getEntity(entityType, id)` returns parsed JSON or `null`.
  - `listEntities(entityType)` returns parsed JSON array.
  - Table creation included in `initDb()`.
- Covers: [F8-AC1, F8-AC2]
- Files:
  - `src/lib/storage/entitiesRepo.ts`
  - `src/lib/storage/db.ts` (wire table creation)
- Depends on: Task 1.7

### Task 1.9 Create sync queue table storage
- Description: Add SQLite persistence for `sync_queue` and helper functions.
- DoD:
  - `enqueueSyncItem(item)` persists an item.
  - `listPendingSyncItems()` returns items ordered by `createdAt` ascending (FIFO).
  - `updateSyncItem(itemId, patch)` updates attemptCount/status/lastError.
  - `deleteSyncItem(itemId)` deletes row.
- Covers: [F8-AC1, F8-AC2, F8-AC5]
- Files:
  - `src/lib/storage/syncQueueRepo.ts`
  - `src/lib/storage/db.ts` (wire table creation)
- Depends on: Task 1.7, Task 1.6

### Task 1.10 Add Profile zustand store (local-first)
- Description: Create `useProfileStore` with local profile state and persistence via entitiesRepo.
- DoD:
  - Store exposes: `profile`, `hydrate()`, `upsertLocalProfile(input)` which writes to SQLite with `syncStatus: "pending"` and timestamps.
  - `hydrate()` reads from SQLite and sets store state.
- Covers: [F1-AC1, F1-AC2, F8-AC1]
- Files:
  - `src/store/profileStore.ts`
- Depends on: Task 1.3, Task 1.8

### Task 1.11 Add Workouts zustand store (sessions only, local-first)
- Description: Create `useWorkoutsStore` for sessions list + create/update local.
- DoD:
  - Exposes: `sessions`, `hydrateSessions()`, `createLocalSession({startedAt,date})`, `patchLocalSession(id, patch)`.
  - New sessions get `syncStatus: "pending"` and local UUID.
  - Persists via `entitiesRepo` under `entityType="workoutSession"`.
- Covers: [F2-AC1, F2-AC8, F8-AC1]
- Files:
  - `src/store/workoutsStore.ts`
- Depends on: Task 1.4, Task 1.2, Task 1.8

### Task 1.12 Extend Workouts store for exercises (add/patch/delete)
- Description: Add local CRUD for `ExerciseEntry` with ordering and persistence.
- DoD:
  - Exposes: `exercisesBySessionId(sessionId)`, `addLocalExercise(sessionId, data)`, `patchLocalExercise(exerciseId, patch)`, `deleteLocalExercise(exerciseId)`.
  - Deletes remove from SQLite.
- Covers: [F2-AC3, F2-AC8, F8-AC1]
- Files:
  - `src/store/workoutsStore.ts`
- Depends on: Task 1.11

### Task 1.13 Extend Workouts store for sets + completion timestamp
- Description: Add local CRUD for `SetEntry` including marking a set completed.
- DoD:
  - Exposes: `setsByExerciseId(exerciseId)`, `addLocalSet(exerciseId, data)`, `patchLocalSet(setId, patch)`, `deleteLocalSet(setId)`.
  - `markSetCompleted(setId, completedAtIso)` sets `completedAt` and persists.
- Covers: [F2-AC4, F4-AC1, F2-AC8]
- Files:
  - `src/store/workoutsStore.ts`
- Depends on: Task 1.12

### Task 1.14 Extend Workouts store for cardio entries
- Description: Add local CRUD for `CardioEntry`.
- DoD:
  - Exposes: `cardioByExerciseId(exerciseId)`, `addLocalCardio(exerciseId, data)`, `patchLocalCardio(id, patch)`, `deleteLocalCardio(id)`.
- Covers: [F2-AC