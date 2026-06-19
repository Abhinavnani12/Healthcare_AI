import express from 'express';
import prisma from '../db.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import { logAudit } from '../utils/auditLogger.js';

const router = express.Router();

/**
 * GET /api/alerts
 * Query parameters: department, priority, status, search
 */
router.get(
  '/',
  authenticateUser,
  authorizeRoles('ADMIN', 'CMO', 'OPERATIONS_HEAD', 'CEO'),
  async (req, res) => {
    try {
      const { department, priority, status, search } = req.query;

      const whereClause = {};

      if (department) {
        whereClause.department = department;
      }
      if (priority) {
        whereClause.priority = priority;
      }
      if (status) {
        whereClause.status = status;
      }
      if (search) {
        whereClause.OR = [
          { title: { contains: search } },
          { description: { contains: search } },
        ];
      }

      const alerts = await prisma.alert.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });

      return res.json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      console.error('Fetch alerts error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve alerts.',
      });
    }
  }
);

/**
 * PATCH /api/alerts/:id/assign
 */
router.patch(
  '/:id/assign',
  authenticateUser,
  authorizeRoles('ADMIN', 'CMO', 'OPERATIONS_HEAD'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { assignedUserId } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID format.' });
      }

      if (!assignedUserId) {
        return res.status(400).json({ success: false, message: 'Assigned User ID is required.' });
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: parseInt(assignedUserId, 10) },
      });

      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'Assigned user not found.' });
      }

      const alert = await prisma.alert.findUnique({ where: { id } });
      if (!alert) {
        return res.status(404).json({ success: false, message: 'Alert not found.' });
      }

      const updatedAlert = await prisma.alert.update({
        where: { id },
        data: {
          status: 'ASSIGNED',
          assignedUserId: targetUser.id,
        },
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });

      // Write audit log
      await logAudit({
        action: 'ASSIGN_ALERT',
        entityType: 'ALERT',
        entityId: id,
        userId: req.user.id,
        details: {
          alertTitle: alert.title,
          assignedTo: targetUser.fullName,
        },
      });

      return res.json({
        success: true,
        message: `Alert assigned to ${targetUser.fullName}.`,
        data: updatedAlert,
      });
    } catch (error) {
      console.error('Assign alert error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to assign alert.',
      });
    }
  }
);

/**
 * PATCH /api/alerts/:id/resolve
 */
router.patch(
  '/:id/resolve',
  authenticateUser,
  authorizeRoles('ADMIN', 'CMO', 'OPERATIONS_HEAD'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID format.' });
      }

      const alert = await prisma.alert.findUnique({ where: { id } });
      if (!alert) {
        return res.status(404).json({ success: false, message: 'Alert not found.' });
      }

      const updatedAlert = await prisma.alert.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
        },
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });

      // Write audit log
      await logAudit({
        action: 'RESOLVE_ALERT',
        entityType: 'ALERT',
        entityId: id,
        userId: req.user.id,
        details: {
          alertTitle: alert.title,
        },
      });

      return res.json({
        success: true,
        message: 'Alert resolved successfully.',
        data: updatedAlert,
      });
    } catch (error) {
      console.error('Resolve alert error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to resolve alert.',
      });
    }
  }
);

export default router;
