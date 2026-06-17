import { decryptData, encryptData } from "./encryption";

export function encryptQuestionnairePayload(payload: unknown): string {
  // Zod already validates shape in the API. Here we only ensure we persist a deterministic representation.
  if (typeof payload === "string") {
    return encryptData(payload);
  }

  // For objects/arrays/etc, we encrypt the JSON representation.
  return encryptData(payload as object);
}

export function decryptQuestionnairePayload(encrypted: unknown, legacy: unknown) {
  if (typeof encrypted === "string" && encrypted.length > 0) {
    const decrypted = decryptData(encrypted);
    try {
      return JSON.parse(decrypted) as unknown;
    } catch {
      // Backward/edge cases: allow plain string payloads.
      return decrypted;
    }
  }

  // Backward compatibility for existing rows (payload stored in clear).
  return legacy;
}

