// @vitest-environment node

import { afterEach, describe, expect, it } from "vitest";
import { getPgSslConfig } from "@/lib/database-ssl";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("getPgSslConfig", () => {
  it("disables ssl when explicitly configured", () => {
    process.env.PGSSLMODE = "disable";

    expect(getPgSslConfig()).toBeUndefined();
  });

  it("defaults to strict verification in production", () => {
    Object.assign(process.env, { NODE_ENV: "production" });
    delete process.env.PGSSLMODE;
    delete process.env.DATABASE_SSL;
    delete process.env.PGSSL_REJECT_UNAUTHORIZED;

    expect(getPgSslConfig()).toEqual({ rejectUnauthorized: true });
  });

  it("allows a custom ca certificate bundle", () => {
    Object.assign(process.env, { NODE_ENV: "development" });
    process.env.PGSSL_CA = "test-ca";
    process.env.PGSSL_REJECT_UNAUTHORIZED = "true";

    expect(getPgSslConfig()).toEqual({
      ca: "test-ca",
      rejectUnauthorized: true,
    });
  });
});
