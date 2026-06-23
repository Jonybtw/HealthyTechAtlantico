import { auth } from "@/lib/auth";
import { ok, serverError, unauthorized } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

// GET /api/users/me/consent-history - recent consent changes for current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return unauthorized();
    }

    const history = await prisma.$queryRaw<
      Array<{
        id: string;
        field: "consentRgpd" | "consentShare" | "kidmedConsent";
        previousValue: boolean | null;
        nextValue: boolean;
        reason: string | null;
        createdAt: Date;
        changedByName: string | null;
        changedByEmail: string | null;
      }>
    >`
      SELECT
        ch."id",
        ch."field",
        ch."previous_value" AS "previousValue",
        ch."next_value" AS "nextValue",
        ch."reason",
        ch."created_at" AS "createdAt",
        u."name" AS "changedByName",
        u."email" AS "changedByEmail"
      FROM "consent_history" ch
      LEFT JOIN "users" u ON u."id" = ch."changed_by"
      WHERE ch."subject_user_id" = ${session.user.id}
      ORDER BY ch."created_at" DESC
      LIMIT 12
    `;

    return ok(
      history.map((entry) => ({
        id: entry.id,
        field: entry.field,
        previousValue: entry.previousValue,
        nextValue: entry.nextValue,
        reason: entry.reason,
        createdAt: entry.createdAt.toISOString(),
        changedBy: entry.changedByEmail
          ? {
              name: entry.changedByName,
              email: entry.changedByEmail,
            }
          : null,
      })),
    );
  } catch (error) {
    console.error("GET /api/users/me/consent-history error:", error);
    return serverError();
  }
}
