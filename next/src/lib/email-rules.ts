export const INTERNAL_EMAIL_DOMAIN = "colegioatlantico.pt";

const INTERNAL_EMAIL_SUFFIX = `@${INTERNAL_EMAIL_DOMAIN}`;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isInternalEmail(email: string): boolean {
  return normalizeEmail(email).endsWith(INTERNAL_EMAIL_SUFFIX);
}

export function isAllowedEmailForRole(role: string, email: string): boolean {
  if (role === "PAIS") {
    return !isInternalEmail(email);
  }

  if (role === "ADMIN" || role === "ALUNO" || role === "PROFESSOR" || role === "PSICOLOGO") {
    return isInternalEmail(email);
  }

  return true;
}

export function getEmailRuleMessage(role: string): string {
  if (role === "PAIS") {
    return `Pais e encarregados de educacao devem usar um email externo a @${INTERNAL_EMAIL_DOMAIN}`;
  }

  return `Utilizadores internos devem usar um email @${INTERNAL_EMAIL_DOMAIN}`;
}
