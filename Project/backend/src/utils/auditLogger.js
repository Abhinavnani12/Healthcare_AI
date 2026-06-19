import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Creates an audit log entry in the database.
 * Does not throw on failure to ensure main process flow is not blocked.
 */
export const logAudit = async ({ action, entityType, entityId, details, userId }) => {
  try {
    await prisma.auditlog.create({
      data: {
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        details: details || null,
        userId: userId ? Number(userId) : null
      }
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
