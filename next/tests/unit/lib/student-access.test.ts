// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERMISSIONS } from "@/lib/rbac";

const { findUniqueMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    student: {
      findUnique: findUniqueMock,
    },
  },
}));

import { getStudentAccessContext } from "@/lib/student-access";

describe("getStudentAccessContext", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
  });

  it("allows the linked student owner", async () => {
    findUniqueMock.mockResolvedValue({
      id: "student-1",
      linkedUserId: "user-1",
      guardians: [],
    });

    await expect(
      getStudentAccessContext(
        "student-1",
        "user-1",
        "ALUNO",
        PERMISSIONS.READ_BIOMETRICS
      )
    ).resolves.toMatchObject({
      ok: true,
      isOwner: true,
      isGuardian: false,
    });
  });

  it("allows guardians only when linked", async () => {
    findUniqueMock.mockResolvedValue({
      id: "student-1",
      linkedUserId: "owner-1",
      guardians: [{ guardianUserId: "guardian-1" }],
    });

    await expect(
      getStudentAccessContext(
        "student-1",
        "guardian-1",
        "PAIS",
        PERMISSIONS.READ_REPORTS
      )
    ).resolves.toMatchObject({
      ok: true,
      isOwner: false,
      isGuardian: true,
    });
  });

  it("denies guardians without a link", async () => {
    findUniqueMock.mockResolvedValue({
      id: "student-1",
      linkedUserId: "owner-1",
      guardians: [],
    });

    await expect(
      getStudentAccessContext(
        "student-1",
        "guardian-2",
        "PAIS",
        PERMISSIONS.READ_REPORTS
      )
    ).resolves.toEqual({
      ok: false,
      status: 403,
      error: "Sem permissão",
    });
  });

  it("returns 404 when the student does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(
      getStudentAccessContext(
        "missing",
        "user-1",
        "ADMIN",
        PERMISSIONS.READ_STUDENT_PROFILE
      )
    ).resolves.toEqual({
      ok: false,
      status: 404,
      error: "Aluno não encontrado",
    });
  });
});
