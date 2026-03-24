import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireAnyRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { AcompanhamentoClient } from "./acompanhamento-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("acompanhamento");

  return {
    title: t("title"),
  };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AcompanhamentoPage({ params }: Props) {
  await requireAnyRole(["ADMIN", "PSICOLOGO"]);

  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      className: true,
      schoolYear: true,
      birthDate: true,
    },
  });

  if (!student) {
    notFound();
  }

  return (
    <AcompanhamentoClient
      student={{
        ...student,
        birthDate: student.birthDate?.toISOString() ?? null,
      }}
    />
  );
}
