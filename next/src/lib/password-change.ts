import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  getPasswordPolicyIssues,
  PASSWORD_POLICY_MESSAGES,
} from "@/lib/password-policy";

export class PasswordChangeUserNotFoundError extends Error {}
export class PasswordChangeInvalidCurrentPasswordError extends Error {}
export class PasswordChangePolicyError extends Error {}

export async function changePasswordForUser({
  email,
  userId,
  currentPassword,
  newPassword,
}: {
  email?: string;
  userId?: string;
  currentPassword: string;
  newPassword: string;
}) {
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
      })
    : email
      ? await prisma.user.findUnique({
          where: { email: email.trim().toLowerCase() },
        })
      : null;

  if (!user) {
    throw new PasswordChangeUserNotFoundError("Utilizador não encontrado");
  }

  const valid = await compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new PasswordChangeInvalidCurrentPasswordError(
      "Palavra-passe atual incorreta",
    );
  }

  if (currentPassword === newPassword) {
    throw new PasswordChangePolicyError(
      PASSWORD_POLICY_MESSAGES.sameAsCurrent,
    );
  }

  const issues = getPasswordPolicyIssues(newPassword);
  if (issues.length > 0) {
    throw new PasswordChangePolicyError(issues[0] ?? "Palavra-passe inválida");
  }

  const passwordHash = await hash(newPassword, 12);

  return prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
    },
  });
}
