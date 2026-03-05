import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function auditLog({
  userId,
  action,
  targetId,
}: {
  userId?: string | null;
  action: string;
  targetId?: string | null;
}) {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim() ?? headersList.get("x-real-ip") ?? "unknown";

  await prisma.auditLog.create({
    data: {
      userId: userId ?? null,
      action,
      targetId: targetId ?? null,
      ipAddress,
    },
  });
}
