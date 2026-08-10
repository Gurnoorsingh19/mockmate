import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

let prisma: PrismaClient;

if (globalForPrisma.prisma) {
  prisma = globalForPrisma.prisma;
} else {
  const libsql = createClient({
    url: process.env.DATABASE_URL || "file:./dev.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const adapter = new PrismaLibSql(libsql);
  prisma = new PrismaClient({ adapter });
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { prisma };
