import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const VERIFICATION_KINDS = {
  student: "student_register",
  guardian: "guardian_register",
  forcePasswordReset: "force_password_reset",
} as const;

export type VerificationIdentifierPayload =
  | {
      kind: typeof VERIFICATION_KINDS.student;
      email: string;
      studentProcessNumber: string;
    }
  | {
      kind: typeof VERIFICATION_KINDS.guardian;
      email: string;
      studentProcessNumber: string;
    }
  | {
      kind: typeof VERIFICATION_KINDS.forcePasswordReset;
      email: string;
    };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeProcessNumber(processNumber: string): string {
  return processNumber.trim();
}

export function buildStudentVerificationIdentifier(
  studentProcessNumber: string,
  email: string,
): string {
  return `${VERIFICATION_KINDS.student}|${encodeURIComponent(
    normalizeProcessNumber(studentProcessNumber),
  )}|${encodeURIComponent(normalizeEmail(email))}`;
}

export function buildGuardianVerificationIdentifier(
  studentProcessNumber: string,
  email: string,
): string {
  return `${VERIFICATION_KINDS.guardian}|${encodeURIComponent(
    normalizeProcessNumber(studentProcessNumber),
  )}|${encodeURIComponent(normalizeEmail(email))}`;
}

export function buildForcePasswordResetIdentifier(email: string): string {
  return `${VERIFICATION_KINDS.forcePasswordReset}|${encodeURIComponent(
    normalizeEmail(email),
  )}`;
}

export function parseVerificationIdentifier(
  identifier: string,
): VerificationIdentifierPayload | null {
  const [kind, rawFirst, rawSecond] = identifier.split("|");

  if (!kind || !rawFirst) {
    return null;
  }

  if (kind === VERIFICATION_KINDS.forcePasswordReset) {
    return {
      kind,
      email: decodeURIComponent(rawFirst),
    };
  }

  if (
    !rawSecond ||
    (kind !== VERIFICATION_KINDS.student &&
      kind !== VERIFICATION_KINDS.guardian)
  ) {
    return null;
  }

  return {
    kind,
    studentProcessNumber: decodeURIComponent(rawFirst),
    email: decodeURIComponent(rawSecond),
  };
}

export async function issueVerificationToken(
  identifier: string,
  ttlMs = VERIFICATION_TOKEN_TTL_MS,
) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + ttlMs);

  await prisma.verificationToken.deleteMany({
    where: { identifier },
  });

  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
    },
  });

  return { token, expires };
}
