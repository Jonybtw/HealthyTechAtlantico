export const INTERNAL_EMAIL_DOMAIN = "colegioatlantico.pt";

const INTERNAL_EMAIL_SUFFIX = `@${INTERNAL_EMAIL_DOMAIN}`;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isInternalEmail(email: string): boolean {
  return normalizeEmail(email).endsWith(INTERNAL_EMAIL_SUFFIX);
}

export function isAllowedEmailForRole(role: string, email: string): boolean {
  if (
    role === "ADMIN" ||
    role === "ALUNO" ||
    role === "PROFESSOR" ||
    role === "PSICOLOGO"
  ) {
    return isInternalEmail(email);
  }

  return true;
}

export function getEmailRuleMessage(): string {
  return `Utilizadores internos devem usar um email @${INTERNAL_EMAIL_DOMAIN}`;
}
