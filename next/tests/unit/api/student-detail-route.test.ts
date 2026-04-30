// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { authMock, auditLogMock, updateMock, accessMock, findUniqueMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  auditLogMock: vi.fn(),
  updateMock: vi.fn(),
  accessMock: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/audit", () => ({
  auditLog: auditLogMock,
}));

vi.mock("@/lib/student-access", () => ({
  getStudentAccessContext: accessMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    student: {
      findUnique: findUniqueMock,
      update: updateMock,
    },
  },
}));

import { PUT } from "@/app/api/students/[id]/route";

describe("PUT /api/students/[id]", () => {
  beforeEach(() => {
    authMock.mockReset();
    auditLogMock.mockReset();
    updateMock.mockReset();
    accessMock.mockReset();
    findUniqueMock.mockReset();

    accessMock.mockResolvedValue({ ok: true });
    findUniqueMock.mockResolvedValue({
      id: "student-1",
      name: "Maria",
    });
    authMock.mockResolvedValue({
      user: { id: "teacher-1", role: "PROFESSOR" },
    });
    auditLogMock.mockResolvedValue(undefined);
    updateMock.mockResolvedValue({
      id: "student-1",
      name: "Maria",
    });
  });

  it("records KIDMED consent at student level and audits the consent update", async () => {
    const response = await PUT(
      new NextRequest("http://localhost/api/students/student-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidmedConsentGranted: true }),
      }),
      { params: Promise.resolve({ id: "student-1" }) },
    );

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "student-1" },
      data: expect.objectContaining({
        kidmedConsentAt: expect.any(Date),
        kidmedConsentRecordedById: "teacher-1",
      }),
    });
    expect(auditLogMock).toHaveBeenCalledWith({
      userId: "teacher-1",
      action: "update_consent",
      targetId: "student-1",
    });

    await expect(response.json()).resolves.toEqual({
      data: {
        id: "student-1",
        name: "Maria",
      },
    });
  });
});
