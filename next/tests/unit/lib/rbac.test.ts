import { describe, expect, it } from "vitest";
import { PERMISSIONS, canAccessSosInbox, canAccessStudentByRole, canRole } from "@/lib/rbac";

describe("rbac", () => {
  it("blocks students from the global SOS inbox", () => {
    expect(canRole("ALUNO", PERMISSIONS.READ_SOS)).toBe(false);
    expect(canAccessSosInbox("ALUNO")).toBe(false);
    expect(canAccessSosInbox("PAIS")).toBe(false);
    expect(canAccessSosInbox("PROFESSOR")).toBe(true);
    expect(canAccessSosInbox("PSICOLOGO")).toBe(true);
  });

  it("keeps student access self-scoped", () => {
    expect(
      canAccessStudentByRole({
        role: "ALUNO",
        permission: PERMISSIONS.READ_BIOMETRICS,
        isOwner: true,
        isGuardian: false,
      })
    ).toBe(true);

    expect(
      canAccessStudentByRole({
        role: "ALUNO",
        permission: PERMISSIONS.READ_BIOMETRICS,
        isOwner: false,
        isGuardian: false,
      })
    ).toBe(false);
  });

  it("allows guardians only for linked students", () => {
    expect(
      canAccessStudentByRole({
        role: "PAIS",
        permission: PERMISSIONS.READ_REPORTS,
        isOwner: false,
        isGuardian: true,
      })
    ).toBe(true);

    expect(
      canAccessStudentByRole({
        role: "PAIS",
        permission: PERMISSIONS.READ_REPORTS,
        isOwner: false,
        isGuardian: false,
      })
    ).toBe(false);
  });
});
