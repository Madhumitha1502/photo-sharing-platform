import { describe, it, expect } from "vitest";
import { hashValue, compareValue, signGalleryToken, verifyGalleryToken } from "../src/lib/auth/jwt";

describe("Customer PIN-Protected Access & Token Verification", () => {
  it("should securely hash and verify 6-digit gallery access PIN", async () => {
    const rawPin = "482917";
    const pinHash = await hashValue(rawPin);

    // Verify bcrypt hash format
    expect(pinHash).not.toBe(rawPin);
    expect(pinHash).toMatch(/^\$2[aby]\$/);

    // Verify correct PIN
    const isValid = await compareValue(rawPin, pinHash);
    expect(isValid).toBe(true);

    // Verify incorrect PIN rejection
    const isInvalid = await compareValue("000000", pinHash);
    expect(isInvalid).toBe(false);
  });

  it("should generate and verify short-lived gallery session token upon successful PIN entry", async () => {
    const gallerySlug = "abc123";
    const eventId = "event-wedding-1";

    const sessionToken = await signGalleryToken({
      gallerySlug,
      eventId,
      verifiedAt: Date.now(),
    });

    expect(typeof sessionToken).toBe("string");

    const payload = await verifyGalleryToken(sessionToken);
    expect(payload).not.toBeNull();
    expect(payload?.gallerySlug).toBe(gallerySlug);
    expect(payload?.eventId).toBe(eventId);
  });

  it("should reject invalid gallery session tokens", async () => {
    const fakeToken = "invalid.bearer.token";
    const payload = await verifyGalleryToken(fakeToken);
    expect(payload).toBeNull();
  });
});
