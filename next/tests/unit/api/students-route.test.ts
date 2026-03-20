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
  });

  it("returns validation error for invalid query params", async () => {
    authMock.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });

    const response = await GET(new NextRequest("http://localhost/api/students?limit=abc"));

    expect(response.status).toBe(400);
    expect(findManyMock).not.toHaveBeenCalled();
    expect(countMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        error: "Dados inválidos",
        issues: expect.any(Array),
      }),
    );
  });

  it("applies validated pagination and filters", async () => {
    const students = [
      {
        id: "student-1",
        name: "Ana",
        sex: "F",
        birthDate: null,
        age: 13,
        schoolYear: "2025/2026",
        className: "8A",
        linkedUserId: null,
      },
    ];

    authMock.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });
    findManyMock.mockResolvedValue(students);
    countMock.mockResolvedValue(2);

    const response = await GET(
      new NextRequest(
        "http://localhost/api/students?page=2&limit=1&search=Ana&school_year=2025/2026&class_name=8A",
      ),
    );

    expect(response.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          name: { contains: "Ana", mode: "insensitive" },
          schoolYear: "2025/2026",
          className: "8A",
        },
        skip: 1,
        take: 1,
      }),
    );
    expect(countMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          name: { contains: "Ana", mode: "insensitive" },
          schoolYear: "2025/2026",
          className: "8A",
        },
      }),
    );

    await expect(response.json()).resolves.toEqual({
      data: {
        students,
        total: 2,
        page: 2,
        pages: 2,
      },
    });
  });
});