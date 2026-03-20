import { type NextRequest } from "next/server";
import { z } from "zod";
import { type Prisma, type Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  created,
  forbidden,
  ok,
  serverError,
  unauthorized,
  validationError,
} from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { canRole, isStaffRole, PERMISSIONS } from "@/lib/rbac";
import { createStudentSchema, listStudentsQuerySchema } from "@/lib/validations";

// GET /api/students - list students (paginated, role-scoped)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const role = session.user.role as Role;
    if (!canRole(role, PERMISSIONS.LIST_STUDENTS)) {
      return forbidden();
    }

    const { searchParams } = new URL(req.url);
    const parsedQuery = listStudentsQuerySchema.parse(
      Object.fromEntries(searchParams.entries()),
    );
    const { page, limit, search, school_year: schoolYear, class_name: className } = parsedQuery;
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {};

    if (role === "ALUNO") {
      where.linkedUserId = session.user.id;
    } else if (role === "PAIS") {
      where.guardians = {
        some: { guardianUserId: session.user.id },
      };
    }

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

    return ok({
      students,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    console.error("GET /api/students error:", error);
    return serverError();
  }
}

// POST /api/students - create student
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const role = session.user.role as Role;
    if (!canRole(role, PERMISSIONS.CREATE_STUDENT) || !isStaffRole(role)) {
      return forbidden();
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

    return created(student);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    console.error("POST /api/students error:", error);
    return serverError();
  }
}
