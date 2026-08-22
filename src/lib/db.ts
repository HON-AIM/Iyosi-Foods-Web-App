import { PrismaClient } from "@prisma/client";

/** Type for the `tx` parameter inside `prisma.$transaction(async (tx) => ...)` */
export type TransactionClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

declare global {
  var prisma: PrismaClient | undefined;
}

function buildPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CRITICAL: Vercel serverless runs many concurrent function instances.
// Without the global singleton pattern, each serverless invocation creates a
// NEW PrismaClient and opens NEW database connections. Under 2000 concurrent
// users this exhausts the connection pool (Neon free tier: 100 connections).
//
// The global pattern reuses a single PrismaClient per Node.js process.
// In Vercel, each warm instance shares one PrismaClient.
//
// DATABASE_URL must use Neon's POOLER host and end with:
//   ?sslmode=require&pgbouncer=true&connection_limit=1&pool_timeout=30
// connection_limit=1 → max 1 connection per serverless instance; Neon's
// PgBouncer multiplexes across all instances (100 instances × 1 = 100 conns).
// pool_timeout=30 → queries queue on that single connection during bursts
// (parallel page renders, Neon cold-starts) instead of erroring at the
// default 10s. It does NOT increase the connection count.
//
// DIRECT_URL (no pgbouncer params) is used only for migrations — see
// prisma/schema.prisma `directUrl`.
// ─────────────────────────────────────────────────────────────────────────────

export const prisma = globalThis.prisma ?? buildPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
