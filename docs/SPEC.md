# SPEC

## Common Principles

- **Tech Stack**: Next.js 15 (App Router), TypeScript (strict), TailwindCSS v4, better-sqlite3 DB on backend, bcryptjs for auth.
- **Authentication**:
  - Auth middleware verifies user session for all protected endpoints.
  - Unauthenticated access to protected APIs returns HTTP 401.
- **API Error Handling**:
  - Return standard HTTP codes: 200 (success), 201 (created), 400 (invalid input), 401 (unauthenticated), 404 (not found), 409 (conflict), 500 (server errors).
  - API responses include `{ error: string, details?: any }` on non-2xx.
- **Naming conventions**:
  - Entity and route names follow camelCase for JSON keys.
  - UUIDs for IDs.
  - Date/time fields use ISO 8601 strings (`YYYY-MM-DD` or full datetime).
- **Offline-first Synchronization**:
  - Write operations store data locally first with `syncStatus` set to `"pending"`.
  - Sync queue items manage retry and conflict resolution; server `updatedAt` supersedes client.
- **UI/UX Patterns**:
  - All screens are mobile-responsive by default.
  - Swipe gestures and pull-to-refresh implemented as per feature specs.
- **Data Validation**:
  - Inputs validated both client and server-side per field constraints.
  - Validation errors return 400 with field-specific error messages.

## Data Models

See model definitions from PRD Data Entities section — all are stored in SQLite with the specified fields and constraints.

---

## Feature List

### F1. Onboarding Profile Setup
- Description: On first launch, users set their fitness goal (strength/diet/maintain) and enter height (cm) and weight (kg). This profile data personalizes the app experience. The profile can be updated later.
- Data: `OnboardingProfile`
- API:  
  - `POST /api/profile/onboarding { goal: "strength"|"diet"|"maintain", heightCm: number, weightKg: number } → { createdAt: string, updatedAt: string } | 400 | 401`
  - `GET /api/profile/onboarding → OnboardingProfile | 401`
- Requirements:
  - AC-1: Given authenticated user without onboarding profile, When user submits valid profile data, Then create profile and return 201 with timestamps.
  - AC-2: Given authenticated user with existing profile, When user updates profile with valid data, Then update profile and return 200 with updated timestamps.
  - AC-3: Given unauthenticated user, When accessing onboarding profile endpoints, Then return 401 Unauthorized.
  - AC-4: Given invalid input (e.g. heightCm < 80 or > 250, weightKg < 20 or > 300), When submitting profile, Then return 400 with validation errors.
  - AC-5: Given profile creation/update success, When fetching onboarding profile, Then return stored profile including createdAt and updatedAt.
  - AC-6 (Edge): Given network failure during profile update, When retrying sync, Then profile updates are retried until success or max retry count.
  - AC-7: Given multiple clients updating profile concurrently with different data, When sync occurs, Then server `updatedAt` with latest datetime wins.

### F2. Workout Session Management & Logging
- Description: Users can create workout sessions with start time and date, add exercises (weight or cardio types), log sets and cardio details, mark sessions completed, and track total volume and duration. Support offline-first recording with local storage and sync queue.
- Data: `WorkoutSession`, `ExerciseEntry`, `SetEntry`, `CardioEntry`, `SyncQueueItem`
- API:  
  - `POST /api/workout-sessions { startedAt: string, date: string } → WorkoutSession | 400 | 401`  
  - `GET /api/workout-sessions/{id} → WorkoutSession + exercises + sets + cardios | 404 | 401`  
  - `PATCH /api/workout-sessions/{id} { endedAt?: string, isCompleted?: boolean, totalVolumeKg?: number, totalDurationSec?: number } → WorkoutSession | 400 | 404 | 401`  
  - `POST /api/workout-sessions/{sessionId}/exercises { name: string, category, type, order, note? } → ExerciseEntry | 400 | 404 | 401`  
  - `PATCH /api/exercise-entries/{id} { name?, note?, order? } → ExerciseEntry | 400 | 404 | 401`  
  - `DELETE /api/exercise-entries/{id} → 204 | 404 | 401`  
  - `POST /api/exercise-entries/{exerciseId}/sets { setNumber, weightKg, reps, restPlannedSec } → SetEntry | 400 | 404 | 401`  
  - `PATCH /api/set-entries/{id} { weightKg?, reps?, completedAt?, restPlannedSec? } → SetEntry | 400 | 404 | 401`  
  - `DELETE /api/set-entries/{id} → 204 | 404 | 401`  
  - `POST /api/exercise-entries/{exerciseId}/cardio { durationSec, distanceKm? } → CardioEntry | 400 | 404 | 401`  
  - `PATCH /api/cardio-entries/{id} { durationSec?, distanceKm? } → CardioEntry | 400 | 404 | 401`  
  - `DELETE /api/cardio-entries/{id} → 204 | 404 | 401`
- Requirements:
  - AC-1: Given authenticated user, When user creates a workout session with valid startedAt and date, Then return 201 with created session including id.
  - AC-2: Given existing workout session ID, When requesting session data, Then return session with related exercises, sets, and cardio entries.
  - AC-3: Given valid exercise data, When adding exercise to a session, Then create ExerciseEntry with specified order and return it.
  - AC-4: Given valid set/cardio data, When adding sets or cardio entries to exercises, Then create respective entries with correct foreign keys and return them.
  - AC-5: Given workout session marked completed, When updating session with endedAt and isCompleted=true, Then update session fields and set totalVolumeKg and totalDurationSec.
  - AC-6: Given unauthenticated user, When calling any workout session or related entity API, Then return 401 Unauthorized.
  - AC-7 (Edge): Given invalid IDs for sessions/exercises, When accessing or modifying entries, Then return 404 Not Found.
  - AC-8 (Edge): Given network is offline, When creating or updating workout-related data, Then store locally with syncStatus pending and add to sync queue.
  - AC-9 (Edge): Given concurrent edits on the same session or entries from multiple devices, When synced, Then server last updatedAt timestamp determines final accepted changes.

### F3. Previous Record Display for Exercise Selection
- Description: When selecting exercises to add, the app shows the most recent previous set record for the chosen exercise (last weight, reps, sets) to help users input current data faster.
- Data: `ExerciseEntry`, `SetEntry`, `WorkoutSession`
- API:  
  - `GET /api/users/me/exercises/{exerciseName}/last-record → { weightKg: number, reps: number, setCount: number, completedAt: string } | 404 | 401`
- Requirements:
  - AC-1: Given authenticated user and exercise name, When user fetches last record, Then return most recent completed set info with accurate weightKg, reps, setCount, and completedAt.
  - AC-2: Given user has no prior completed sets for the exercise, When fetching last record, Then return 404 with error "No previous record found".
  - AC-3: Given unauthenticated user, When accessing last record endpoint, Then return 401 Unauthorized.
  - AC-4 (Edge): Given multiple sets completed at same datetime, When fetching last record, Then return set data from the most recent workout session's completedAt.
  - AC-5: Given invalid or empty exerciseName, When fetching last record, Then return 400 validation error.

### F4. Rest Timer with Auto Start and Notification
- Description: After user marks a set complete, a rest timer starts automatically inside the app UI with countdown and options for vibration and sound notifications when finished. Timer only triggers notification if app is in foreground.
- Data: (UI state, no backend data)
- Requirements:
  - AC-1: Given user marks a set as completed, When marking is recorded, Then rest timer immediately starts countdown from `restPlannedSec` of the set.
  - AC-2: Given rest timer is running and app remains in foreground, When timer reaches zero, Then app triggers vibration and sound notification if enabled.
  - AC-3: Given rest timer is running and app goes to background or screen is locked, When timer reaches zero, Then no vibration or sound occurs.
  - AC-4: Given user completes another set during active timer, When previous timer is running, Then timer resets and starts the new set's restPlannedSec countdown.
  - AC-5: Given user disables vibration and sound toggle options, When rest timer ends, Then neither vibration nor sound is triggered.
  - AC-6: Given user navigates away from workout screen while timer is active, When returning, Then timer continues counting correctly from elapsed time.
  - AC-7: Given no set is marked complete, When accessing rest timer controls, Then timer is not visible or running.

### F5. Friend Feed with Likes and Comments
- Description: Users can see a timeline feed of friends’ workout summaries, react with likes, and comment. Like and comment actions support offline creation with local queue and sync later. Feed updates show last sync time, allowing pull-to-refresh.
- Data: `FeedItem`, `FeedReaction`, `FeedComment`, `Friendship`, `SyncQueueItem`
- API:  
  - `GET /api/feed → FeedItem[] | 401`  
  - `POST /api/feed/{feedItemId}/like → FeedReaction | 400 | 401`  
  - `DELETE /api/feed/{feedItemId}/like → 204 | 404 | 401`  
  - `GET /api/feed/{feedItemId}/comments → FeedComment[] | 404 | 401`  
  - `POST /api/feed/{feedItemId}/comments { content: string } → FeedComment | 400 | 404 | 401`  
- Requirements:
  - AC-1: Given authenticated user with accepted friends, When requesting feed, Then return FeedItem list ordered by createdAt descending with authorUserId, summary, and createdAt.
  - AC-2: Given user taps like on a feed item, When online, Then create FeedReaction and update UI including syncStatus synced.
  - AC-3: Given user taps like on a feed item while offline, When action performed, Then locally create FeedReaction with syncStatus pending and enqueue SyncQueueItem.
  - AC-4: Given user submits comment on a feed item, When content length is between 1 and 300, Then create FeedComment and return it.
  - AC-5: Given unauthenticated user, When accessing feed or commenting APIs, Then return 401 Unauthorized.
  - AC-6: Given user attempts to like or comment on nonexistent feed item, When performing action, Then return 404 Not Found.
  - AC-7 (Edge): Given malformed comment content exceeding 300 chars or empty, When submitting comment, Then return 400 with validation error.
  - AC-8 (Edge): Given network failure during like or comment, When retrying sync, Then items persist in queue and retry up to max attempts.

### F6. Weekly Challenge Creation and Participation
- Description: Users create weekly challenges with type (days or volume), start/end dates, and invite friends. Participants join challenges, track progress, and view leaderboard with ranks and progress values updating live.
- Data: `Challenge`, `ChallengeParticipant`, `Friendship`, `SyncQueueItem`
- API:  
  - `POST /api/challenges { title, type: "days"|"volume", startDate, endDate } → Challenge | 400 | 401`  
  - `GET /api/challenges?filter=active|ended → Challenge[] | 401`  
  - `POST /api/challenges/{id}/join → ChallengeParticipant | 400 | 401 | 404`  
  - `POST /api/challenges/{id}/leave → 204 | 404 | 401`  
  - `GET /api/challenges/{id}/leaderboard → ChallengeParticipant[] | 404 | 401`  
- Requirements:
  - AC-1: Given authenticated user, When creating a challenge with valid title, type, and date range, Then create challenge and return 201 with challenge data.
  - AC-2: Given user requests active or ended challenge lists, When valid filter provided, Then return array of challenges filtered accordingly.
  - AC-3: Given user joins a challenge, When user is not already a participant, Then create ChallengeParticipant with progressValue=0 and return it.
  - AC-4: Given user leaves joined challenge, When request is valid, Then remove ChallengeParticipant for user and return 204.
  - AC-5: Given challenge ID, When requesting leaderboard, Then return participants ordered descending by progressValue.
  - AC-6: Given unauthenticated user, When accessing any challenge API, Then return 401 Unauthorized.
  - AC-7: Given invalid dates (endDate < startDate), When creating challenge, Then return 400 with validation error.
  - AC-8 (Edge): Given network is offline, When creating/joining/leaving challenge, Then action is stored locally with syncStatus pending and enqueued.
  - AC-9: Given multiple devices update participation/progress concurrently, When syncing, Then server last `updatedAt` timestamp wins.

### F7. Basic Weekly Stats and Personal Records Display
- Description: Users can view weekly total workout volume as bar chart and see personal records for each exercise with maxWeight, maxReps, and maxVolume values and dates achieved.
- Data: `WorkoutSession`, `PersonalRecord`
- API:  
  - `GET /api/stats/weekly-volume?weekStart={YYYY-MM-DD} → { [date]: number } | 400 | 401`  
  - `GET /api/stats/personal-records → PersonalRecord[] | 401`
- Requirements:
  - AC-1: Given authenticated user and valid week start date (Monday), When fetching weekly volume, Then return object mapping YYYY-MM-DD dates for the week to totalVolumeKg numbers (0 if none).
  - AC-2: Given authenticated user, When fetching personal records, Then return array of PersonalRecord objects with exerciseName, prType, value, and achievedAt.
  - AC-3: Given invalid weekStart format or out-of-range date, When requesting weekly volume, Then return 400 validation error.
  - AC-4: Given unauthenticated user, When accessing stats API, Then return 401 Unauthorized.
  - AC-5 (Edge): Given no workouts in selected week, When fetching weekly volume, Then return all 7 days with values 0.
  - AC-6 (Edge): Given personal records updated on multiple devices, When synchronizing, Then accept server latest updatedAt records.
  - AC-7: Given weekly volume or PR data is updated locally, When user refreshes stats, Then updated data is shown immediately from local cache.

### F8. Offline-First Sync and Conflict Handling
- Description: All create, update, delete actions on workouts, feed reactions/comments, challenges, friendships use local storage and sync queue to enable offline usage. Sync applies retry, conflict resolution by last update timestamp, and error states for failed items.
- Data: All entities with syncStatus, plus `SyncQueueItem`
- API:
  - Various endpoints from above features including support for batched/pending sync requests.
  - For brevity, each data mutation endpoint accepts `updatedAt` from client and returns canonical server `updatedAt`.
- Requirements:
  - AC-1: Given user performs data mutation actions offline, When action is completed in UI, Then data saved locally with `syncStatus=pending` and `SyncQueueItem` created.
  - AC-2: Given network reconnect or manual refresh, When sync process runs, Then all pending SyncQueueItems are retried FIFO with server.
  - AC-3: Given server responds with conflict (outdated updatedAt), When syncing, Then client updates local data with server `updatedAt` and data.
  - AC-4: Given server responds with unrecoverable error (4xx except conflict), When syncing, Then SyncQueueItem marked error and user notified accordingly.
  - AC-5: Given sync retry fails repeatedly (max attempts reached), When user performs next sync, Then error status remains and user prompted with error banner.
  - AC-6: Given user unauthenticated or session expired, When syncing, Then server returns 401 and sync process halts until reauthentication.
  - AC-7: Given concurrent edits on same entity from multiple sources, When syncing, Then server last updatedAt wins and client data is updated to server’s version.
  - AC-8: Given app foreground/background changes during sync, When network connectivity fluctuates, Then sync process continues/resumes accordingly without data loss.

---

## Assumptions

- User's auth and session management are provided by template and integrated for all protected endpoints.
- Data syncing between client and server uses timestamps for conflict resolution.
- Offline-first experience prioritizes UI responsiveness at expense of short-term data divergence.
- Last completed set is a valid proxy for "previous record" per exercise for display.
- Exercise names are consistent when creating workouts to correctly associate previous records and PRs.
- Timer notification only requires in-app triggering, no push notification support.
- Social features such as friend invitations and challenge invites act via existing friendship relations only.
- PR calculation logic is handled on server side upon workout session completion.

---

## Open Questions

1. What is the exact UI/UX flow for challenge invitations — search by user ID or QR code first? (MVP currently favors user ID search.)
2. Should the "previous record" display show just last completed set or aggregate recent N sets? (MVP uses just last completed set.)
3. What detail level defines premium features for stats and challenges?
4. Are user visible sync error notifications needed beyond console logging and badges?
5. Is there a need to provide manual conflict resolution UI or is last update wins acceptable?