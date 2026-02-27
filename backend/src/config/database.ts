/**
 * Prisma client singleton for database access.
 * Handles initialisation, connection, and graceful shutdown.
 */

import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | null = null;

/**
 * Get the singleton PrismaClient instance.
 * Creates one on first call; reuses it thereafter.
 */
export function getPrismaClient(): PrismaClient {
    if (!prisma) {
        prisma = new PrismaClient({
            log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
        });
    }
    return prisma;
}

/**
 * Initialise the database connection (call once at server startup).
 */
export async function initializeDatabase(): Promise<void> {
    const client = getPrismaClient();
    await client.$connect();
}

/**
 * Gracefully close the database connection (call on shutdown).
 */
export async function closeDatabase(): Promise<void> {
    if (prisma) {
        await prisma.$disconnect();
        prisma = null;
    }
}
