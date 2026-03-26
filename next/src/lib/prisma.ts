import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { getPgSslConfig } from "@/lib/database-ssl";

function makePrisma() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: getPgSslConfig(),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaPg(pool as any);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
