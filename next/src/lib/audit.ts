import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

async function resolveIpAddress() {
  try {
    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    return (
      forwarded?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "unknown"
    );
  } catch {
    return "unknown";
  }
}

export async function auditLog({
  userId,
  action,
  targetId,
  ipAddress,
}: {
  userId?: string | null;
  action: string;
  targetId?: string | null;
  ipAddress?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      userId: userId ?? null,
      action,
      targetId: targetId ?? null,
      ipAddress: ipAddress ?? (await resolveIpAddress()),
    },
  });
}
