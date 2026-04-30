import { randomInt } from "crypto";

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_POLICY_MESSAGES = {
  minLength: `A palavra-passe deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`,
  uppercase: "A palavra-passe deve incluir pelo menos uma letra maiuscula.",
  number: "A palavra-passe deve incluir pelo menos um numero.",
  sameAsCurrent:
    "A nova palavra-passe deve ser diferente da palavra-passe atual.",
} as const;

const UPPERCASE_REGEX = /[A-Z]/;
const NUMBER_REGEX = /\d/;
const TEMP_PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

export function getPasswordPolicyIssues(password: string): string[] {
  const issues: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    issues.push(PASSWORD_POLICY_MESSAGES.minLength);
  }

  if (!UPPERCASE_REGEX.test(password)) {
    issues.push(PASSWORD_POLICY_MESSAGES.uppercase);
  }

  if (!NUMBER_REGEX.test(password)) {
    issues.push(PASSWORD_POLICY_MESSAGES.number);
  }

  return issues;
}

export function isPasswordStrong(password: string): boolean {
  return getPasswordPolicyIssues(password).length === 0;
}

export function generateTemporaryPassword(length = 12): string {
  const requiredCharacters = ["A", "a", "8"];
  const password = [...requiredCharacters];

  while (password.length < length) {
    password.push(
      TEMP_PASSWORD_ALPHABET[
        randomInt(0, TEMP_PASSWORD_ALPHABET.length)
      ] ?? "A",
    );
  }

  for (let index = password.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index + 1);
    [password[index], password[swapIndex]] = [
      password[swapIndex] ?? password[index] ?? "A",
      password[index] ?? password[swapIndex] ?? "A",
    ];
  }

  return password.join("");
}
