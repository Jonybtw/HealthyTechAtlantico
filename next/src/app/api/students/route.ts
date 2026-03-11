import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canRole, isStaffRole, PERMISSIONS } from "@/lib/rbac";
import { createStudentSchema } from "@/lib/validations";
import { type Prisma, type Role } from "@prisma/client";

// GET /api/students — list students (paginated, role-scoped)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const role = session.user.role as Role;
    if (!canRole(role, PERMISSIONS.LIST_STUDENTS)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));
    const search = searchParams.get("search") || "";
    const schoolYear = searchParams.get("school_year") || "";
    const className = searchParams.get("class_name") || "";
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {};

    if (role === "ALUNO") {
      where.linkedUserId = session.user.id;
    } else if (role === "PAIS") {
      where.guardians = {
        some: { guardianUserId: session.user.id },
      };
    }
    // PROFESSOR and PSICOLOGO see all students

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (schoolYear) {
      where.schoolYear = schoolYear;
    }
    if (className) {
      where.className = className;
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          sex: true,
          birthDate: true,
          age: true,
          schoolYear: true,
          className: true,
          linkedUserId: true,
        },
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({
      students,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/students error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST /api/students — create student
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const role = session.user.role as Role;
    if (!canRole(role, PERMISSIONS.CREATE_STUDENT) || !isStaffRole(role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();
    const data = createStudentSchema.parse(body);

    const student = await prisma.student.create({
      data: {
        name: data.name,
        sex: data.sex,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        age: data.age ?? null,
        schoolYear: data.schoolYear ?? null,
        className: data.className ?? null,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("POST /api/students error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
