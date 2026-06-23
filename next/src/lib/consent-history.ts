import { headers } from "next/headers";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

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

export async function recordConsentHistory({
  subjectUserId,
  subjectStudentId,
  changedById,
  field,
  previousValue,
  nextValue,
  reason,
}: {
  subjectUserId?: string | null;
  subjectStudentId?: string | null;
  changedById?: string | null;
  field: "consentRgpd" | "consentShare" | "kidmedConsent";
  previousValue?: boolean | null;
  nextValue: boolean;
  reason?: string | null;
}) {
  if (!subjectUserId && !subjectStudentId) {
    return;
  }

  await prisma.$executeRaw`
    INSERT INTO "consent_history" (
      "id",
      "subject_user_id",
      "subject_student_id",
      "changed_by",
      "field",
      "previous_value",
      "next_value",
      "reason",
      "ip_address"
    )
    VALUES (
      ${randomUUID()},
      ${subjectUserId ?? null},
      ${subjectStudentId ?? null},
      ${changedById ?? null},
      ${field},
      ${previousValue ?? null},
      ${nextValue},
      ${reason ?? null},
      ${await resolveIpAddress()}
    )
  `;
}
