export type SyncStatus = "pending" | "synced" | "error";

export type IsoDateString = string;
export type IsoDateTimeString = string;

export interface ApiErrorResponse {
  error: string;
  details?: unknown;
}
