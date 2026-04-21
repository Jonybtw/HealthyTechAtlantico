import { describe, expect, it } from "vitest";
import { canAccessStudentByRole, PERMISSIONS } from "@/lib/rbac";

describe("canAccessStudentByRole", () => {
  it("allows psychologists to access student resources they are permitted to read", () => {
    const canAccess = canAccessStudentByRole({
      role: "PSICOLOGO",
      permission: PERMISSIONS.READ_TESTS,
      isOwner: false,
      isGuardian: false,
    });

    expect(canAccess).toBe(true);
  });

  it("keeps psychologists blocked from permissions outside their matrix", () => {
    const canAccess = canAccessStudentByRole({
      role: "PSICOLOGO",
      permission: PERMISSIONS.SEND_REPORTS,
      isOwner: false,
      isGuardian: false,
    });

    expect(canAccess).toBe(false);
  });

  it("requires ALUNO ownership when checking access", () => {
    expect(
      canAccessStudentByRole({
        role: "ALUNO",
        permission: PERMISSIONS.READ_TESTS,
        isOwner: true,
        isGuardian: false,
      }),
    ).toBe(true);

    expect(
      canAccessStudentByRole({
        role: "ALUNO",
        permission: PERMISSIONS.READ_TESTS,
        isOwner: false,
        isGuardian: false,
      }),
    ).toBe(false);
  });

  it("requires guardian linkage for PAIS access", () => {
    expect(
      canAccessStudentByRole({
        role: "PAIS",
        permission: PERMISSIONS.READ_TESTS,
        isOwner: false,
        isGuardian: true,
      }),
    ).toBe(true);

    expect(
      canAccessStudentByRole({
        role: "PAIS",
        permission: PERMISSIONS.READ_TESTS,
        isOwner: false,
        isGuardian: false,
      }),
    ).toBe(false);
  });
});
