import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canAccessStudentByRole, type Permission } from "@/lib/rbac";

type StudentAccessSuccess = {
  ok: true;
  student: {
    id: string;
    linkedUserId: string | null;
    guardians: { guardianUserId: string }[];
  };
  isOwner: boolean;
  isGuardian: boolean;
};

type StudentAccessFailure = {
  ok: false;
  status: 403 | 404;
  error: string;
};

export type StudentAccessResult = StudentAccessSuccess | StudentAccessFailure;

export async function getStudentAccessContext(
  studentId: string,
  userId: string,
  role: Role,
  permission: Permission
): Promise<StudentAccessResult> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      linkedUserId: true,
      guardians: { select: { guardianUserId: true } },
    },
  });

  if (!student) {
    return { ok: false, status: 404, error: "Aluno não encontrado" };
  }

  const isOwner = student.linkedUserId === userId;
  const isGuardian = student.guardians.some(
    (guardian) => guardian.guardianUserId === userId
  );

  if (!canAccessStudentByRole({ role, permission, isOwner, isGuardian })) {
    return { ok: false, status: 403, error: "Sem permissão" };
  }

  return { ok: true, student, isOwner, isGuardian };
}

export async function getLinkedStudentByUserId(userId: string) {
  return prisma.student.findUnique({
    where: { linkedUserId: userId },
  });
}
