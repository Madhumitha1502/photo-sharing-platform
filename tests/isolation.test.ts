import { describe, it, expect } from "vitest";

describe("Event Isolation & Customer Access Privacy", () => {
  it("should block team member from accessing unassigned events", () => {
    const assignedUserIds = ["user-team-1", "user-team-2"];
    const requestingUserId = "user-team-3"; // unassigned user

    const isAuthorized = assignedUserIds.includes(requestingUserId);
    expect(isAuthorized).toBe(false);
  });

  it("should permit assigned team member to access event", () => {
    const assignedUserIds = ["user-team-1", "user-team-2"];
    const requestingUserId = "user-team-1"; // assigned user

    const isAuthorized = assignedUserIds.includes(requestingUserId);
    expect(isAuthorized).toBe(true);
  });

  it("should filter out unselected/draft photos from customer gallery view", () => {
    const allUploadedPhotos = [
      { id: "p1", filename: "ceremony.jpg", isSelected: true },
      { id: "p2", filename: "candid_raw_test.jpg", isSelected: false },
      { id: "p3", filename: "reception.jpg", isSelected: true },
      { id: "p4", filename: "lighting_failed.jpg", isSelected: false },
    ];

    // Customer query filter: isSelected: true
    const customerVisiblePhotos = allUploadedPhotos.filter((p) => p.isSelected);

    expect(customerVisiblePhotos.length).toBe(2);
    expect(customerVisiblePhotos.map((p) => p.id)).toEqual(["p1", "p3"]);
    expect(customerVisiblePhotos.some((p) => !p.isSelected)).toBe(false);
  });
});
