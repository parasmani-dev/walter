import { PrismaClient } from "@prisma/client";

// In a real multi-agent deployment, each agent would connect to its isolated DB.
// For FR-103 (isolated PostgreSQL), we use this client.
// We are currently using SQLite for initial build as per the scope.
export const prisma = new PrismaClient();
