import { prisma } from "@/lib/prisma";

type ResolvedByLike = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

type SosAlertLike = {
  psych: string;
  teacher: string;
  psychEmail: string | null;
  teacherEmail: string | null;
  resolvedBy: ResolvedByLike | null;
};

function looksLikeEmail(value: string | null | undefined): value is string {
  return Boolean(value && value.includes("@"));
}

function prettifyEmailIdentity(email: string): string {
  const localPart = email.split("@")[0] ?? email;
  const normalized = localPart
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  if (normalized === "psicologo") {
    return "Psicólogo";
  }

  if (normalized === "professor") {
    return "Professor";
  }

  if (normalized === "admin") {
    return "Administrador";
  }

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveDisplayName({
  rawName,
  rawEmail,
  matchedName,
}: {
  rawName: string | null | undefined;
  rawEmail: string | null | undefined;
  matchedName?: string | null;
}) {
  const trimmedName = rawName?.trim();

  if (matchedName?.trim()) {
    return matchedName.trim();
  }

  if (trimmedName && !looksLikeEmail(trimmedName)) {
    return trimmedName;
  }

  if (rawEmail) {
    return prettifyEmailIdentity(rawEmail);
  }

  if (trimmedName) {
    return prettifyEmailIdentity(trimmedName);
  }

  return "-";
}

function resolveDisplayEmail(
  rawEmail: string | null | undefined,
  rawName: string,
) {
  if (rawEmail) {
    return rawEmail;
  }

  return looksLikeEmail(rawName) ? rawName : null;
}

export async function normalizeSosAlerts<T extends SosAlertLike>(
  alerts: T[],
): Promise<T[]> {
  const candidateEmails = new Set<string>();

  for (const alert of alerts) {
    if (alert.psychEmail) {
      candidateEmails.add(alert.psychEmail);
    } else if (looksLikeEmail(alert.psych)) {
      candidateEmails.add(alert.psych);
    }

    if (alert.teacherEmail) {
      candidateEmails.add(alert.teacherEmail);
    } else if (looksLikeEmail(alert.teacher)) {
      candidateEmails.add(alert.teacher);
    }

    if (alert.resolvedBy?.email) {
      candidateEmails.add(alert.resolvedBy.email);
    }
  }

  const users =
    candidateEmails.size > 0
      ? await prisma.user.findMany({
          where: { email: { in: Array.from(candidateEmails) } },
          select: { email: true, name: true },
        })
      : [];

  const userNameByEmail = new Map(users.map((user) => [user.email, user.name]));

  return alerts.map((alert) => {
    const psychEmail = resolveDisplayEmail(alert.psychEmail, alert.psych);
    const teacherEmail = resolveDisplayEmail(alert.teacherEmail, alert.teacher);

    return {
      ...alert,
      psych: resolveDisplayName({
        rawName: alert.psych,
        rawEmail: psychEmail,
        matchedName: psychEmail ? userNameByEmail.get(psychEmail) : null,
      }),
      teacher: resolveDisplayName({
        rawName: alert.teacher,
        rawEmail: teacherEmail,
        matchedName: teacherEmail ? userNameByEmail.get(teacherEmail) : null,
      }),
      psychEmail,
      teacherEmail,
      resolvedBy: alert.resolvedBy
        ? {
            ...alert.resolvedBy,
            name: resolveDisplayName({
              rawName: alert.resolvedBy.name,
              rawEmail: alert.resolvedBy.email,
              matchedName: userNameByEmail.get(alert.resolvedBy.email),
            }),
          }
        : null,
    };
  });
}
