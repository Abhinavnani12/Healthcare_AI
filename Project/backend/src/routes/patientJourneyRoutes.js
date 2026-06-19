import express from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../db.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import { logAudit } from '../utils/auditLogger.js';

const router = express.Router();

// Helper to handle validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

/**
 * GET /api/patient-journeys (Read list with search, filter, sorting, pagination)
 */
router.get(
  '/',
  authenticateUser,
  authorizeRoles('ADMIN', 'CMO', 'OPERATIONS_HEAD', 'CEO'),
  async (req, res) => {
    try {
      const {
        search,
        department,
        stage,
        billingStatus,
        admissionDateFrom,
        admissionDateTo,
        sortBy = 'admissionDate',
        sortOrder = 'desc',
        page = 1,
        limit = 10,
      } = req.query;

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      // Construct filter conditions
      const whereClause = {};

      if (search) {
        whereClause.OR = [
          { patientName: { contains: search } },
          { maskedPatientId: { contains: search } },
        ];
      }

      if (department) {
        whereClause.department = department;
      }

      if (stage) {
        whereClause.currentStage = stage;
      }

      if (billingStatus) {
        whereClause.billingStatus = billingStatus;
      }

      if (admissionDateFrom || admissionDateTo) {
        whereClause.admissionDate = {};
        if (admissionDateFrom) {
          whereClause.admissionDate.gte = new Date(admissionDateFrom);
        }
        if (admissionDateTo) {
          whereClause.admissionDate.lte = new Date(admissionDateTo);
        }
      }

      // Check sorting options
      const allowedSortColumns = ['admissionDate', 'patientName', 'maskedPatientId', 'currentStage', 'billingStatus', 'expectedDischargeDate'];
      const sortCol = allowedSortColumns.includes(sortBy) ? sortBy : 'admissionDate';
      const order = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';

      // Execute query
      const [list, total] = await Promise.all([
        prisma.patientjourney.findMany({
          where: whereClause,
          orderBy: { [sortCol]: order },
          skip,
          take: limitNum,
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        }),
        prisma.patientjourney.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      return res.json({
        success: true,
        data: {
          list,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages,
          },
        },
      });
    } catch (error) {
      console.error('Fetch patient journeys error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve patient journeys.',
      });
    }
  }
);

/**
 * GET /api/patient-journeys/:id (Read detail)
 */
router.get(
  '/:id',
  authenticateUser,
  authorizeRoles('ADMIN', 'CMO', 'OPERATIONS_HEAD', 'CEO'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID format.' });
      }

      const journey = await prisma.patientjourney.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });

      if (!journey) {
        return res.status(404).json({ success: false, message: 'Patient journey not found.' });
      }

      return res.json({ success: true, data: journey });
    } catch (error) {
      console.error('Fetch patient journey detail error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve patient journey details.',
      });
    }
  }
);

/**
 * POST /api/patient-journeys (Create)
 */
router.post(
  '/',
  authenticateUser,
  authorizeRoles('ADMIN', 'CMO', 'OPERATIONS_HEAD'),
  [
    body('patientName').notEmpty().withMessage('Patient name is required'),
    body('department').notEmpty().withMessage('Department is required'),
    body('assignedDoctor').notEmpty().withMessage('Assigned doctor is required'),
    body('currentStage').isIn(['REGISTRATION','CONSULTATION','TESTS','DIAGNOSIS','ADMISSION','TREATMENT','DISCHARGE','FOLLOW_UP']).withMessage('Invalid treatment stage'),
    body('billingStatus').isIn(['PENDING','CLEARED','INSURANCE_REVIEW']).withMessage('Invalid billing status'),
    body('admissionDate').notEmpty().withMessage('Admission date is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const {
        patientName,
        department,
        assignedDoctor,
        admissionDate,
        currentStage,
        pendingTests,
        expectedDischargeDate,
        delayReason,
        billingStatus,
        notes,
      } = req.body;

      // Generate maskedPatientId: NS-XXXXX
      // Find maximum numeric suffix of NS-XXXXX
      const lastPatient = await prisma.patientjourney.findFirst({
        where: {
          maskedPatientId: { startsWith: 'NS-' },
        },
        orderBy: {
          maskedPatientId: 'desc',
        },
      });

      let nextNum = 41020; // Default starting number
      if (lastPatient) {
        const match = lastPatient.maskedPatientId.match(/NS-(\d+)/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }

      const maskedPatientId = `NS-${nextNum}`;

      const newJourney = await prisma.patientjourney.create({
        data: {
          maskedPatientId,
          patientName,
          department,
          assignedDoctor,
          admissionDate: new Date(admissionDate),
          currentStage,
          pendingTests: pendingTests || null,
          expectedDischargeDate: expectedDischargeDate ? new Date(expectedDischargeDate) : null,
          delayReason: delayReason || null,
          billingStatus,
          notes: notes || null,
          createdByUserId: req.user.id,
          updatedAt: new Date(),
        },
      });

      // Write audit log
      await logAudit({
        action: 'CREATE_PATIENT_JOURNEY',
        entityType: 'PATIENT_JOURNEY',
        entityId: newJourney.id,
        userId: req.user.id,
        details: { maskedPatientId, patientName, department },
      });

      return res.status(201).json({
        success: true,
        message: 'Patient journey created successfully.',
        data: newJourney,
      });
    } catch (error) {
      console.error('Create patient journey error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create patient journey.',
      });
    }
  }
);

/**
 * PUT /api/patient-journeys/:id (Update)
 */
router.put(
  '/:id',
  authenticateUser,
  authorizeRoles('ADMIN', 'CMO', 'OPERATIONS_HEAD'),
  [
    body('patientName').notEmpty().withMessage('Patient name is required'),
    body('department').notEmpty().withMessage('Department is required'),
    body('assignedDoctor').notEmpty().withMessage('Assigned doctor is required'),
    body('currentStage').isIn(['REGISTRATION','CONSULTATION','TESTS','DIAGNOSIS','ADMISSION','TREATMENT','DISCHARGE','FOLLOW_UP']).withMessage('Invalid treatment stage'),
    body('billingStatus').isIn(['PENDING','CLEARED','INSURANCE_REVIEW']).withMessage('Invalid billing status'),
  ],
  validate,
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID format.' });
      }

      const existingJourney = await prisma.patientjourney.findUnique({
        where: { id },
      });

      if (!existingJourney) {
        return res.status(404).json({ success: false, message: 'Patient journey not found.' });
      }

      const {
        patientName,
        department,
        assignedDoctor,
        admissionDate,
        currentStage,
        pendingTests,
        expectedDischargeDate,
        delayReason,
        billingStatus,
        notes,
      } = req.body;

      const updatedJourney = await prisma.patientjourney.update({
        where: { id },
        data: {
          patientName,
          department,
          assignedDoctor,
          admissionDate: admissionDate ? new Date(admissionDate) : existingJourney.admissionDate,
          currentStage,
          pendingTests: pendingTests || null,
          expectedDischargeDate: expectedDischargeDate ? new Date(expectedDischargeDate) : null,
          delayReason: delayReason || null,
          billingStatus,
          notes: notes || null,
          updatedAt: new Date(),
        },
      });

      // Write audit log
      await logAudit({
        action: 'UPDATE_PATIENT_JOURNEY',
        entityType: 'PATIENT_JOURNEY',
        entityId: id,
        userId: req.user.id,
        details: {
          maskedPatientId: updatedJourney.maskedPatientId,
          patientName,
          changes: {
            stage: currentStage,
            billingStatus,
          },
        },
      });

      return res.json({
        success: true,
        message: 'Patient journey updated successfully.',
        data: updatedJourney,
      });
    } catch (error) {
      console.error('Update patient journey error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update patient journey.',
      });
    }
  }
);

/**
 * DELETE /api/patient-journeys/:id (Delete)
 */
router.delete(
  '/:id',
  authenticateUser,
  authorizeRoles('ADMIN', 'CMO', 'OPERATIONS_HEAD'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID format.' });
      }

      const existingJourney = await prisma.patientjourney.findUnique({
        where: { id },
      });

      if (!existingJourney) {
        return res.status(404).json({ success: false, message: 'Patient journey not found.' });
      }

      await prisma.patientjourney.delete({
        where: { id },
      });

      // Write audit log
      await logAudit({
        action: 'DELETE_PATIENT_JOURNEY',
        entityType: 'PATIENT_JOURNEY',
        entityId: id,
        userId: req.user.id,
        details: {
          maskedPatientId: existingJourney.maskedPatientId,
          patientName: existingJourney.patientName,
        },
      });

      return res.json({
        success: true,
        message: 'Patient journey deleted successfully.',
      });
    } catch (error) {
      console.error('Delete patient journey error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete patient journey.',
      });
    }
  }
);

export default router;
