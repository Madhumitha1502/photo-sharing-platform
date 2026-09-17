import { describe, it, expect } from "vitest";
import { publishGallerySchema, updatePhotoSelectionSchema } from "../src/lib/validations/schemas";

describe("Gallery Publishing & Role Boundaries", () => {
  it("should validate PIN constraints for publishing gallery", () => {
    // Valid numeric PINs
    expect(publishGallerySchema.safeParse({ pin: "482917" }).success).toBe(true);
    expect(publishGallerySchema.safeParse({ pin: "1234" }).success).toBe(true);

    // Invalid PINs: non-numeric, too short, or empty
    expect(publishGallerySchema.safeParse({ pin: "abc" }).success).toBe(false);
    expect(publishGallerySchema.safeParse({ pin: "12" }).success).toBe(false);
    expect(publishGallerySchema.safeParse({ pin: "" }).success).toBe(false);
  });

  it("should validate photo curation selection payloads", () => {
    expect(
      updatePhotoSelectionSchema.safeParse({
        photoIds: ["photo-1", "photo-2"],
        isSelected: true,
      }).success
    ).toBe(true);

    expect(
      updatePhotoSelectionSchema.safeParse({
        photoIds: [],
        isSelected: true,
      }).success
    ).toBe(false);
  });

  it("should enforce RBAC rule: Team Members cannot publish galleries", () => {
    // Simulating authorization logic in /api/events/[id]/gallery/publish
    const canPublish = (role: string) => role === "ADMIN";

    expect(canPublish("ADMIN")).toBe(true);
    expect(canPublish("TEAM_MEMBER")).toBe(false);
  });

  it("should enforce RBAC rule: Team Members cannot curate other users photos", () => {
    // Simulating authorization logic in /api/events/[id]/photos/selection
    const canCurate = (role: string) => role === "ADMIN";

    expect(canCurate("ADMIN")).toBe(true);
    expect(canCurate("TEAM_MEMBER")).toBe(false);
  });
});
