import { type NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { conflict, created, serverError, validationError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return conflict("Email já registado");
    }

    const passwordHash = await hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        role: data.role,
        consentRgpd: data.consentRgpd,
      },
    });

    return created({ id: user.id, email: user.email, role: user.role });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationError(error.issues);
    }

    console.error("Register error:", error);
    return serverError();
  }
}
