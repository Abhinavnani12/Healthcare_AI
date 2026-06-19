import express from 'express';
import prisma from '../db.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import { logAudit } from '../utils/auditLogger.js';

const router = express.Router();

// Apply auth to all routes
router.use(authenticateUser);

/**
 * GET /api/reports
 * Returns report logs
 */
router.get('/', authorizeRoles('ADMIN', 'CEO', 'CMO', 'OPERATIONS_HEAD'), async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Fetch reports history error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve report logs.' });
  }
});

/**
 * POST /api/reports/generate
 * Creates a report log and generates summary dataset
 */
router.post('/generate', authorizeRoles('ADMIN', 'CEO', 'CMO', 'OPERATIONS_HEAD'), async (req, res) => {
  try {
    const { type, startDate, endDate, department } = req.body;

    if (!type) {
      return res.status(400).json({ success: false, message: 'Report type is required.' });
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let name = '';
    let summaryData = {};

    switch (type) {
      case 'executive':
        name = 'Executive Hospital Operational Summary';
        const metrics = await prisma.dailyhospitalmetric.findMany({
          where: { metricDate: { gte: start, lte: end } },
          orderBy: { metricDate: 'desc' },
        });
        summaryData = {
          totalDaysLogged: metrics.length,
          avgBedsOccupied: metrics.reduce((acc, m) => acc + m.occupiedBeds, 0) / (metrics.length || 1),
          avgPatientSatisfaction: metrics.reduce((acc, m) => acc + m.patientSatisfaction, 0) / (metrics.length || 1),
          totalRevenue: metrics.reduce((acc, m) => acc + parseFloat(m.collectedRevenue.toString()), 0),
          totalOperatingCosts: metrics.reduce((acc, m) => acc + parseFloat(m.operatingCosts.toString()), 0),
        };
        break;

      case 'icu':
        name = 'ICU Operations Critical Summary';
        const icuRecords = await prisma.icurecord.findMany({
          where: { recordedAt: { gte: start, lte: end } },
        });
        summaryData = {
          totalEntriesLogged: icuRecords.length,
          peakVentilatorsInUse: Math.max(...icuRecords.map((r) => r.ventilatorsInUse), 0),
          avgOccupiedBeds: icuRecords.reduce((acc, r) => acc + r.occupiedBeds, 0) / (icuRecords.length || 1),
          peakCriticalPatients: Math.max(...icuRecords.map((r) => r.criticalPatients), 0),
        };
        break;

      case 'emergency':
        name = 'Emergency Room Intake & SLA Report';
        const cases = await prisma.emergencycase.findMany({
          where: { arrivalTime: { gte: start, lte: end } },
        });
        summaryData = {
          totalPatientsReceived: cases.length,
          avgWaitMinutes: cases.reduce((acc, c) => acc + c.waitMinutes, 0) / (cases.length || 1),
          waitTimeAboveSLA: cases.filter((c) => c.waitMinutes > 45).length,
          casesByTriage: {
            Critical: cases.filter((c) => c.triageCategory === 'Critical').length,
            High: cases.filter((c) => c.triageCategory === 'High').length,
            Medium: cases.filter((c) => c.triageCategory === 'Medium').length,
            Low: cases.filter((c) => c.triageCategory === 'Low').length,
          },
        };
        break;

      case 'patient-journey':
        name = 'Patient Journey Treatment Stage & Flow Analysis';
        const whereClause = { admissionDate: { gte: start, lte: end } };
        if (department) {
          whereClause.department = department;
        }
        const journeys = await prisma.patientjourney.findMany({ where: whereClause });
        summaryData = {
          totalJourneys: journeys.length,
          byStage: {
            REGISTRATION: journeys.filter((j) => j.currentStage === 'REGISTRATION').length,
            CONSULTATION: journeys.filter((j) => j.currentStage === 'CONSULTATION').length,
            TESTS: journeys.filter((j) => j.currentStage === 'TESTS').length,
            DIAGNOSIS: journeys.filter((j) => j.currentStage === 'DIAGNOSIS').length,
            ADMISSION: journeys.filter((j) => j.currentStage === 'ADMISSION').length,
            TREATMENT: journeys.filter((j) => j.currentStage === 'TREATMENT').length,
            DISCHARGE: journeys.filter((j) => j.currentStage === 'DISCHARGE').length,
            FOLLOW_UP: journeys.filter((j) => j.currentStage === 'FOLLOW_UP').length,
          },
          pendingBilling: journeys.filter((j) => j.billingStatus === 'PENDING').length,
        };
        break;

      case 'doctor-productivity':
        name = 'Doctor Workload & Feedback Performance Summary';
        const docMetrics = await prisma.doctorproductivitymetric.findMany({
          include: { doctor: true },
        });
        summaryData = docMetrics.map((dm) => ({
          doctorName: dm.doctor.name,
          department: dm.doctor.department,
          patientsHandled: dm.patientsHandled,
          consultationsCompleted: dm.consultationsCompleted,
          surgeries: dm.scheduledSurgeries,
          feedback: dm.patientFeedback,
          workload: dm.workloadLevel,
        }));
        break;

      case 'financial':
        name = 'Hospital Revenue & Payment Summary';
        const bills = await prisma.bill.findMany({
          where: { createdAt: { gte: start, lte: end } },
        });
        summaryData = {
          totalInvoicedAmount: bills.reduce((acc, b) => acc + parseFloat(b.amount.toString()), 0),
          clearedAmount: bills.filter((b) => b.status === 'CLEARED').reduce((acc, b) => acc + parseFloat(b.amount.toString()), 0),
          pendingAmount: bills.filter((b) => b.status === 'PENDING').reduce((acc, b) => acc + parseFloat(b.amount.toString()), 0),
          insuranceReviewAmount: bills.filter((b) => b.status === 'INSURANCE_REVIEW').reduce((acc, b) => acc + parseFloat(b.amount.toString()), 0),
        };
        break;

      case 'alerts':
        name = 'Operational Alerts Frequency & Action Report';
        const alerts = await prisma.alert.findMany({
          where: { createdAt: { gte: start, lte: end } },
        });
        summaryData = {
          totalAlertsGenerated: alerts.length,
          resolved: alerts.filter((a) => a.status === 'RESOLVED').length,
          assigned: alerts.filter((a) => a.status === 'ASSIGNED').length,
          open: alerts.filter((a) => a.status === 'OPEN').length,
          byPriority: {
            CRITICAL: alerts.filter((a) => a.priority === 'CRITICAL').length,
            HIGH: alerts.filter((a) => a.priority === 'HIGH').length,
            MEDIUM: alerts.filter((a) => a.priority === 'MEDIUM').length,
            LOW: alerts.filter((a) => a.priority === 'LOW').length,
          },
        };
        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid report type.' });
    }

    // Save report generation log
    const reportLog = await prisma.report.create({
      data: {
        name,
        type,
        filters: { startDate, endDate, department },
        generatedBy: req.user.fullName,
      },
    });

    // Write audit log
    await logAudit({
      action: 'GENERATE_REPORT',
      entityType: 'REPORT',
      entityId: reportLog.id,
      userId: req.user.id,
      details: { type, name },
    });

    return res.json({
      success: true,
      message: 'Report generated successfully.',
      data: {
        id: reportLog.id,
        name: reportLog.name,
        createdAt: reportLog.createdAt,
        data: summaryData,
      },
    });
  } catch (error) {
    console.error('Generate report error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate report.' });
  }
});

export default router;
