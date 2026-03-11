import { describe, it, expect } from "vitest";
import { createUuid } from "@/lib/uuid";
import { validateOnboardingProfileInput } from "@/lib/models/onboardingProfile";

describe("createUuid", () => {
  it("returns a string of length >= 8", () => {
    const id = createUuid();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThanOrEqual(8);
  });

  it("is not all whitespace", () => {
    const id = createUuid();
    expect(id.trim().length).toBeGreaterThan(0);
  });

  it("produces unique values", () => {
    const ids = new Set(Array.from({ length: 100 }, () => createUuid()));
    expect(ids.size).toBe(100);
  });
});

describe("validateOnboardingProfileInput", () => {
  const valid = { goal: "strength", heightCm: 170, weightKg: 70 };

  it("returns ok:true for valid input", () => {
    const result = validateOnboardingProfileInput(valid);
    expect(result.ok).toBe(true);
  });

  it("returns fieldErrors.heightCm when heightCm < 80", () => {
    const result = validateOnboardingProfileInput({ ...valid, heightCm: 79 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors.heightCm).toBeDefined();
  });

  it("returns fieldErrors.heightCm when heightCm > 250", () => {
    const result = validateOnboardingProfileInput({ ...valid, heightCm: 251 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors.heightCm).toBeDefined();
  });

  it("returns fieldErrors.weightKg when weightKg < 20", () => {
    const result = validateOnboardingProfileInput({ ...valid, weightKg: 19 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors.weightKg).toBeDefined();
  });

  it("returns fieldErrors.weightKg when weightKg > 300", () => {
    const result = validateOnboardingProfileInput({ ...valid, weightKg: 301 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors.weightKg).toBeDefined();
  });

  it("returns fieldErrors.goal for invalid goal", () => {
    const result = validateOnboardingProfileInput({ ...valid, goal: "bulk" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors.goal).toBeDefined();
  });
});
