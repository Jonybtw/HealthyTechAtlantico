// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, findManyMock, findUsersMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  findManyMock: vi.fn(),
  findUsersMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    sosAlert: {
      findMany: findManyMock,
    },
    user: {
      findMany: findUsersMock,
    },
  },
}));

import { GET } from "@/app/api/stats/sos-alerts/route";

describe("GET /api/stats/sos-alerts", () => {
  beforeEach(() => {
    authMock.mockReset();
    findManyMock.mockReset();
    findUsersMock.mockReset();
  });

  it("rejects students from the staff inbox", async () => {
    authMock.mockResolvedValue({
      user: { id: "student-user", role: "ALUNO" },
    });

    const response = await GET();

    expect(response.status).toBe(403);
    expect(findManyMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ error: "Sem permissão" });
  });

  it("returns alerts for staff roles", async () => {
    const alerts = [
      {
        id: "alert-1",
        psych: "psicologo@colegioatlantico.pt",
        teacher: "professor@colegioatlantico.pt",
        psychEmail: null,
        teacherEmail: null,
        resolved: false,
        resolvedBy: null,
        student: { id: "student-1", name: "Ana", className: "8A", schoolYear: "2025/2026" },
      },
    ];

    authMock.mockResolvedValue({
      user: { id: "teacher-user", role: "PROFESSOR" },
    });
    findManyMock.mockResolvedValue(alerts);
    findUsersMock.mockResolvedValue([]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledOnce();
    await expect(response.json()).resolves.toEqual({
      data: [
        {
          ...alerts[0],
          psych: "Psicologo",
          teacher: "Professor",
          psychEmail: "psicologo@colegioatlantico.pt",
          teacherEmail: "professor@colegioatlantico.pt",
        },
      ],
    });
  });
});
