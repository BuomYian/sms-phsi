import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function logAction(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
) {
  try {
    await db.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details: details as Prisma.InputJsonValue,
        ipAddress,
      },
    });
  } catch (error) {
    console.error("Failed to log audit action:", error);
  }
}
