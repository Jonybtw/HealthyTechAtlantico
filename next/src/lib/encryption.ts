import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
// Em produção, esta chave DEVE vir de variáveis de ambiente e ter 32 bytes.
const RAW_SECRET_KEY = process.env.ENCRYPTION_KEY;

if (!RAW_SECRET_KEY) {
  // Fail-closed: nunca aceitamos uma chave por omissão em produção.
  // Em desenvolvimento/testes, o valor é carregado por `.env` (ver `README.md`).
  throw new Error(
    "[Segurança] A variável de ambiente ENCRYPTION_KEY é obrigatória e deve ter exatamente 32 bytes.",
  );
}

if (Buffer.from(RAW_SECRET_KEY).length !== 32) {
  throw new Error(
    "[Segurança] A ENCRYPTION_KEY deve ter exatamente 32 bytes de comprimento.",
  );
}

const SECRET_KEY = Buffer.from(RAW_SECRET_KEY);

/**
 * Cifra um payload JSON ou uma string utilizando AES-256-GCM
 * @param data O texto ou objeto JSON a ser cifrado
 * @returns {string} Texto cifrado codificado em formato Base64 contendo IV:AuthTag:Cifrado
 */
export function encryptData(data: string | object): string {
  const text = typeof data === "object" ? JSON.stringify(data) : data;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");

  return `${iv.toString("base64")}:${authTag}:${encrypted}`;
}

/**
 * Decifra um payload AES-256-GCM
 * @param encryptedData Dados cifrados no formato IV:AuthTag:Cifrado
 * @returns {string} Texto em limpo descifrado (ou devolve o próprio texto se não for o formato esperado)
 */
export function decryptData(encryptedData: string): string {
  if (!encryptedData || !encryptedData.includes(":")) {
    // Retornar os dados assumindo que não estão cifrados (fallback / migração)
    return encryptedData;
  }

  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) return encryptedData;

    const [ivStr, authTagStr, encryptedStr] = parts;
    const iv = Buffer.from(ivStr, "base64");
    const authTag = Buffer.from(authTagStr, "base64");

    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedStr, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("[Segurança] Falha na decifragem:", error);
    throw new Error("Não foi possível decifrar os dados (chave errada ou corrupção de dados).");
  }
}
