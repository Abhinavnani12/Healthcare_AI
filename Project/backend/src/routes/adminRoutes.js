import express from 'express';
import prisma from '../db.js';
import { authenticateUser, authorizeRoles, requireActiveAccount } from '../middleware/auth.js';
import { logAudit } from '../utils/auditLogger.js';

const router = express.Router();

// Apply admin protection to all routes in this router
router.use(authenticateUser);
router.use(requireActiveAccount);
router.use(authorizeRoles('ADMIN'));

/**
 * GET /api/admin/users
 * Search by name or email, filter by role, filter by status
 */
router.get('/users', async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const whereClause = {};

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role) {
      whereClause.role = role;
    }

    if (status) {
      whereClause.isActive = status === 'active';
    }

    // Exclude current logged in admin if desired, but typically we want to show all users
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      success: true,
      data: {
        list: users,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error('Admin fetch users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve registered users.',
    });
  }
});

/**
 * PATCH /api/admin/users/:id/role
 */
router.patch('/users/:id/role', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { role } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    }

    const allowedRoles = ['ADMIN', 'CEO', 'CMO', 'OPERATIONS_HEAD'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specification.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Prevent changing own role to avoid locking oneself out of Admin Panel
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role to prevent lockout.',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    // Write audit log
    await logAudit({
      action: 'CHANGE_USER_ROLE',
      entityType: 'USER',
      entityId: id,
      userId: req.user.id,
      details: {
        targetUserEmail: targetUser.email,
        oldRole: targetUser.role,
        newRole: role,
      },
    });

    return res.json({
      success: true,
      message: `User role updated to ${role} successfully.`,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Admin update role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user role.',
    });
  }
});

/**
 * PATCH /api/admin/users/:id/status
 */
router.patch('/users/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { isActive } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Status must be a boolean.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Prevent deactivating own account
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    // Write audit log
    await logAudit({
      action: isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      entityType: 'USER',
      entityId: id,
      userId: req.user.id,
      details: {
        targetUserEmail: targetUser.email,
      },
    });

    return res.json({
      success: true,
      message: `User account has been ${isActive ? 'activated' : 'deactivated'} successfully.`,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Admin toggle status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user status.',
    });
  }
});

export default router;
