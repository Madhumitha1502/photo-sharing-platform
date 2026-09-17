import { describe, it, expect } from "vitest";
import { hashValue, compareValue, signUserToken, verifyUserToken } from "../src/lib/auth/jwt";

describe("Authentication & Authorization Security", () => {
  it("should securely hash and verify passwords using bcrypt", async () => {
    const rawPassword = "SecurePassword123!";
    const hash = await hashValue(rawPassword);

    expect(hash).not.toBe(rawPassword);
    expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt format check

    const isValid = await compareValue(rawPassword, hash);
    expect(isValid).toBe(true);

    const isWrong = await compareValue("WrongPassword", hash);
    expect(isWrong).toBe(false);
  });

  it("should correctly sign and verify Admin JWT tokens", async () => {
    const adminPayload = {
      userId: "user-admin-1",
      email: "admin@trizen.com",
      name: "Lead Admin",
      role: "ADMIN" as const,
    };

    const token = await signUserToken(adminPayload);
    expect(typeof token).toBe("string");

    const decoded = await verifyUserToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(adminPayload.userId);
    expect(decoded?.role).toBe("ADMIN");
  });

  it("should correctly distinguish Team Member role from Admin", async () => {
    const teamPayload = {
      userId: "user-team-1",
      email: "photographer@trizen.com",
      name: "Alex Photographer",
      role: "TEAM_MEMBER" as const,
    };

    const token = await signUserToken(teamPayload);
    const decoded = await verifyUserToken(token);

    expect(decoded?.role).toBe("TEAM_MEMBER");
    expect(decoded?.role).not.toBe("ADMIN");
  });
});
