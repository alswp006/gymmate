import type { IsoDateTimeString } from "@/lib/types";

export interface SyncQueueItem {
  id: string;
  createdAt: IsoDateTimeString;
  attemptCount: number;
  status: "pending" | "error";
  method: "POST" | "PATCH" | "DELETE";
  path: string;
  body: unknown | null;
  entityType: string;
  entityId: string;
  lastError?: string;
}
