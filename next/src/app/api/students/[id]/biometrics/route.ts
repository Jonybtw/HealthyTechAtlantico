import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PERMISSIONS, type Permission } from "@/lib/rbac";
import { biometricsSchema } from "@/lib/validations";
import { auditLog } from "@/lib/audit";
import type { Role } from "@prisma/client";
import { getStudentAccessContext } from "@/lib/student-access";

async function checkAccess(
  studentId: string,
  userId: string,
  role: Role,
  permission: Permission
) {
  return getStudentAccessContext(studentId, userId, role, permission);
}

// GET /api/students/[id]/biometrics
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
    const access = await checkAccess(id, session.user.id, session.user.role as Role, PERMISSIONS.READ_BIOMETRICS);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    // Audit read
    await auditLog({ userId: session.user.id, action: "read_biometrics", targetId: id });

    const biometrics = await prisma.biometric.findMany({
      where: { studentId: id },
      orderBy: { recordedAt: "desc" },
    });

    return NextResponse.json(biometrics);
  } catch (error) {
    console.error("GET biometrics error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST /api/students/[id]/biometrics
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Check RGPD consent
    if (!session.user.consentRgpd) {
      return NextResponse.json({ error: "Consentimento RGPD necessário" }, { status: 403 });
    }

    const { id } = await params;
    const access = await checkAccess(id, session.user.id, session.user.role as Role, PERMISSIONS.RECORD_BIOMETRICS);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const body = await req.json();
    const data = biometricsSchema.parse(body);

    const biometric = await prisma.biometric.create({
      data: {
        studentId: id,
        sessionId: data.sessionId ?? null,
        heightM: data.heightM,
        weightKg: data.weightKg,
        fatPct: data.fatPct ?? null,
        waistCm: data.waistCm ?? null,
        imc: data.imc,
        imcZone: data.imcZone,
        fatZone: data.fatZone ?? null,
        waistZone: data.waistZone ?? null,
      },
    });

    return NextResponse.json(biometric, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("POST biometrics error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
