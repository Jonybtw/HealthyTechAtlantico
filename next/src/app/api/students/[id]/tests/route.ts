import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { testsSchema } from "@/lib/validations";
import { auditLog } from "@/lib/audit";
import type { Role } from "@prisma/client";
import { getStudentAccessContext } from "@/lib/student-access";

// GET /api/students/[id]/tests
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const access = await getStudentAccessContext(
      id,
      session.user.id,
      session.user.role as Role,
      PERMISSIONS.READ_TESTS
    );
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    await auditLog({ userId: session.user.id, action: "read_tests", targetId: id }).catch(() => { });

    const url = new URL(_req.url);
    const latestOnly = url.searchParams.get("latest") === "true";

    const tests = await prisma.test.findMany({
      where: { studentId: id },
      orderBy: { recordedAt: "desc" },
    });

    const result = latestOnly
      ? Object.values(
        tests.reduce<Record<string, typeof tests[number]>>((acc, t) => {
          if (!acc[t.testId]) acc[t.testId] = t;
          return acc;
        }, {})
      )
      : tests;

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET tests error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST /api/students/[id]/tests — batch insert
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const access = await getStudentAccessContext(
      id,
      session.user.id,
      session.user.role as Role,
      PERMISSIONS.RECORD_TESTS
    );
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    if (!session.user.consentRgpd) {
      return NextResponse.json({ error: "Consentimento RGPD necessário" }, { status: 403 });
    }

    const body = await req.json();
    const data = testsSchema.parse(body);

    await auditLog({ userId: session.user.id, action: "record_tests", targetId: id }).catch(() => { });

    const created = await prisma.test.createMany({
      data: data.tests.map((t) => ({
        studentId: id,
        sessionId: data.sessionId ?? null,
        testId: t.testId,
        valueNum: t.valueNum ?? null,
        valueText: t.valueText,
        unit: t.unit,
        zone: t.zone,
      })),
    });

    return NextResponse.json({ count: created.count }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("POST tests error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
