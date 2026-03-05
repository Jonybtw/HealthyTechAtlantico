import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccessStudentByRole, PERMISSIONS } from "@/lib/rbac";
import { biometricsSchema } from "@/lib/validations";
import { auditLog } from "@/lib/audit";
import type { Role } from "@prisma/client";

// Helper to check student access
async function checkAccess(studentId: string, userId: string, role: Role, permission: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { guardians: { select: { guardianUserId: true } } },
  });
  if (!student) return { error: "Aluno não encontrado", status: 404 };

  const isOwner = student.userId === userId;
  const isGuardian = student.guardians.some((g) => g.guardianUserId === userId);

  if (!canAccessStudentByRole({ role, permission: permission as any, isOwner, isGuardian })) {
    return { error: "Sem permissão", status: 403 };
  }
  return { student };
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
    if ("error" in access) {
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
    if ("error" in access) {
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
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("POST biometrics error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
