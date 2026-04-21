// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { authMock, findManyMock, countMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    student: {
      findMany: findManyMock,
      count: countMock,
    },
  },
}));

import { GET } from "@/app/api/students/route";

describe("GET /api/students", () => {
  beforeEach(() => {
    authMock.mockReset();
    findManyMock.mockReset();
    countMock.mockReset();

    authMock.mockResolvedValue({
      user: { id: "staff-1", role: "PROFESSOR" },
    });
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(0);
  });

  it("returns 401 when the request is not authenticated", async () => {
    authMock.mockResolvedValue(null);

    const response = await GET(new NextRequest("http://localhost/api/students"));

    expect(response.status).toBe(401);
    expect(findManyMock).not.toHaveBeenCalled();
    expect(countMock).not.toHaveBeenCalled();
  });

  it("returns 403 when role is not allowed to list students", async () => {
    authMock.mockResolvedValue({
      user: { id: "staff-1", role: "UNKNOWN_ROLE" },
    });

    const response = await GET(new NextRequest("http://localhost/api/students"));

    expect(response.status).toBe(403);
    expect(findManyMock).not.toHaveBeenCalled();
    expect(countMock).not.toHaveBeenCalled();
  });

  it("scopes ALUNO requests to the linked user and applies pagination/filters", async () => {
    authMock.mockResolvedValue({
      user: { id: "student-user-1", role: "ALUNO" },
    });
    findManyMock.mockResolvedValue([
      {
        id: "student-1",
        name: "Ana",
        sex: "F",
        birthDate: null,
        age: null,
        schoolYear: "2025/2026",
        className: "8A",
        kidmedConsentAt: null,
        linkedUserId: "student-user-1",
      },
    ]);
    countMock.mockResolvedValue(23);

    const response = await GET(
      new NextRequest(
        "http://localhost/api/students?page=2&limit=10&search=ana&school_year=2025/2026&class_name=8A",
      ),
    );

    expect(response.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledWith({
      where: {
        linkedUserId: "student-user-1",
        name: { contains: "ana", mode: "insensitive" },
        schoolYear: "2025/2026",
        className: "8A",
      },
      skip: 10,
      take: 10,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        sex: true,
        birthDate: true,
        age: true,
        schoolYear: true,
        className: true,
        kidmedConsentAt: true,
        linkedUserId: true,
      },
    });
    expect(countMock).toHaveBeenCalledWith({
      where: {
        linkedUserId: "student-user-1",
        name: { contains: "ana", mode: "insensitive" },
        schoolYear: "2025/2026",
        className: "8A",
      },
    });

    await expect(response.json()).resolves.toEqual({
      data: {
        students: [
          {
            id: "student-1",
            name: "Ana",
            sex: "F",
            birthDate: null,
            age: null,
            schoolYear: "2025/2026",
            className: "8A",
            kidmedConsentAt: null,
            linkedUserId: "student-user-1",
          },
        ],
        total: 23,
        page: 2,
        pages: 3,
      },
    });
  });

  it("scopes PAIS requests to guardian links", async () => {
    authMock.mockResolvedValue({
      user: { id: "guardian-1", role: "PAIS" },
    });

    const response = await GET(new NextRequest("http://localhost/api/students?limit=25"));

    expect(response.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          guardians: {
            some: { guardianUserId: "guardian-1" },
          },
        },
        skip: 0,
        take: 25,
      }),
    );
    expect(countMock).toHaveBeenCalledWith({
      where: {
        guardians: {
          some: { guardianUserId: "guardian-1" },
        },
      },
    });
  });
});
