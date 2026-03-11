import type pg from "pg";

function isTruthy(value: string | undefined) {
  return value === "1" || value === "true" || value === "yes";
}

function shouldUseSsl() {
  const mode = process.env.PGSSLMODE?.toLowerCase();

  if (mode === "disable" || mode === "allow") {
    return false;
  }

  if (process.env.DATABASE_SSL?.toLowerCase() === "disable") {
    return false;
  }

  return true;
}

export function getPgSslConfig(): pg.PoolConfig["ssl"] | undefined {
  if (!shouldUseSsl()) {
    return undefined;
  }

  const ca = process.env.PGSSL_CA ?? process.env.DATABASE_CA_CERT;
  const rejectUnauthorized = process.env.PGSSL_REJECT_UNAUTHORIZED
    ? isTruthy(process.env.PGSSL_REJECT_UNAUTHORIZED)
    : process.env.NODE_ENV === "production";

  return {
    rejectUnauthorized,
    ...(ca ? { ca } : {}),
  };
}
