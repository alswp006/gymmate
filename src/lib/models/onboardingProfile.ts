import type { SyncStatus, IsoDateTimeString } from "@/lib/types";

export type OnboardingGoal = "strength" | "diet" | "maintain";

export interface OnboardingProfile {
  id: string;
  goal: OnboardingGoal;
  heightCm: number;
  weightKg: number;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
  syncStatus: SyncStatus;
}

const HEIGHT_MIN = 80;
const HEIGHT_MAX = 250;
const WEIGHT_MIN = 20;
const WEIGHT_MAX = 300;

const VALID_GOALS: OnboardingGoal[] = ["strength", "diet", "maintain"];

type FieldErrors = Partial<Record<"goal" | "heightCm" | "weightKg", string>>;

type ValidationResult =
  | { ok: true }
  | { ok: false; fieldErrors: FieldErrors };

export interface OnboardingProfileInput {
  goal: string;
  heightCm: number;
  weightKg: number;
}

export function validateOnboardingProfileInput(
  input: OnboardingProfileInput
): ValidationResult {
  const fieldErrors: FieldErrors = {};

  if (!VALID_GOALS.includes(input.goal as OnboardingGoal)) {
    fieldErrors.goal = `Goal must be one of: ${VALID_GOALS.join(", ")}`;
  }

  if (input.heightCm < HEIGHT_MIN || input.heightCm > HEIGHT_MAX) {
    fieldErrors.heightCm = `Height must be between ${HEIGHT_MIN} and ${HEIGHT_MAX} cm`;
  }

  if (input.weightKg < WEIGHT_MIN || input.weightKg > WEIGHT_MAX) {
    fieldErrors.weightKg = `Weight must be between ${WEIGHT_MIN} and ${WEIGHT_MAX} kg`;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return { ok: true };
}
