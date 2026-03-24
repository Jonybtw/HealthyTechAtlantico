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
    auditLog: {
      findMany: findManyMock,
      count: countMock,
    },
  },
}));

import { GET } from "@/app/api/audit/route";

describe("GET /api/audit", () => {
  beforeEach(() => {
    authMock.mockReset();
    findManyMock.mockReset();
    countMock.mockReset();
  });

  it("rejects non-admin users", async () => {
    authMock.mockResolvedValue({
      user: { id: "teacher-1", role: "PROFESSOR" },
    });

    const response = await GET(new NextRequest("http://localhost/api/audit"));

    expect(response.status).toBe(403);
    expect(findManyMock).not.toHaveBeenCalled();
    expect(countMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      error: expect.stringMatching(/^Sem permiss/i),
    });
  });

  it("returns validation error for non-ISO dates", async () => {
    authMock.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });

    const response = await GET(
      new NextRequest("http://localhost/api/audit?startDate=2026-01-01"),
    );

    expect(response.status).toBe(400);
    expect(findManyMock).not.toHaveBeenCalled();
    expect(countMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        error: expect.stringMatching(/^Dados inv/i),
        issues: expect.any(Array),
      }),
    );
  });

  it("applies validated pagination and filters", async () => {
    const logs = [
      {
        id: "log-1",
        action: "login",
        targetId: null,
        ipAddress: "127.0.0.1",
        createdAt: new Date("2026-01-15T10:00:00.000Z"),
        user: { email: "admin@colegioatlantico.pt", name: "Admin" },
      },
    ];

    authMock.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });
    findManyMock.mockResolvedValue(logs);
    countMock.mockResolvedValue(12);

    const response = await GET(
      new NextRequest(
        "http://localhost/api/audit?page=2&limit=10&action=login&startDate=2026-01-01T00:00:00.000Z&endDate=2026-01-31T23:59:59.000Z&sortBy=action&sortDir=asc",
      ),
    );

    expect(response.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledWith({
      where: {
        action: { contains: "login", mode: "insensitive" },
        createdAt: {
          gte: new Date("2026-01-01T00:00:00.000Z"),
          lte: new Date("2026-01-31T23:59:59.000Z"),
        },
      },
      skip: 10,
      take: 10,
      orderBy: { action: "asc" },
      include: {
        user: { select: { email: true, name: true } },
      },
    });
    expect(countMock).toHaveBeenCalledWith({
      where: {
        action: { contains: "login", mode: "insensitive" },
        createdAt: {
          gte: new Date("2026-01-01T00:00:00.000Z"),
          lte: new Date("2026-01-31T23:59:59.000Z"),
        },
      },
    });

    await expect(response.json()).resolves.toEqual({
      data: {
        logs: [
          {
            id: "log-1",
            action: "login",
            targetId: null,
            ipAddress: "127.0.0.1",
            createdAt: "2026-01-15T10:00:00.000Z",
            userEmail: "admin@colegioatlantico.pt",
            userName: "Admin",
          },
        ],
        total: 12,
        page: 2,
        pages: 2,
      },
    });
  });
});
