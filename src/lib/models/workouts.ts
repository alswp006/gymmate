import type { SyncStatus, IsoDateString, IsoDateTimeString } from "@/lib/types";

export interface WorkoutSession {
  id: string;
  startedAt: IsoDateTimeString;
  date: IsoDateString;
  endedAt?: IsoDateTimeString;
  isCompleted: boolean;
  totalVolumeKg?: number;
  totalDurationSec?: number;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  syncStatus: SyncStatus;
}

export interface ExerciseEntry {
  id: string;
  sessionId: string;
  name: string;
  category?: string;
  type: "weight" | "cardio";
  order: number;
  note?: string;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  syncStatus: SyncStatus;
}

export interface SetEntry {
  id: string;
  exerciseId: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  restPlannedSec: number;
  completedAt?: IsoDateTimeString;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  syncStatus: SyncStatus;
}

export interface CardioEntry {
  id: string;
  exerciseId: string;
  durationSec: number;
  distanceKm?: number;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  syncStatus: SyncStatus;
}
