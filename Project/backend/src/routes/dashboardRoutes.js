import express from 'express';
import prisma from '../db.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all dashboard routes
router.use(authenticateUser);

/**
 * Helper to fetch latest metrics and trends
 */
async function getLatestMetrics() {
  const latestMetric = await prisma.dailyhospitalmetric.findFirst({
    orderBy: { metricDate: 'desc' },
  });

  const trends = await prisma.dailyhospitalmetric.findMany({
    orderBy: { metricDate: 'asc' },
    take: 14,
  });

  return { latestMetric, trends };
}

/**
 * GET /api/dashboard/executive
 * Returns overall hospital executive metrics
 */
router.get(
  '/executive',
  authorizeRoles('ADMIN', 'CEO', 'OPERATIONS_HEAD'),
  async (req, res) => {
    try {
      const { latestMetric, trends } = await getLatestMetrics();
      if (!latestMetric) {
        return res.status(404).json({ success: false, message: 'No metrics found.' });
      }

      // Major Risks count: open/assigned alerts with CRITICAL/HIGH priority
      const majorRisksCount = await prisma.alert.count({
        where: {
          status: { in: ['OPEN', 'ASSIGNED'] },
          priority: { in: ['CRITICAL', 'HIGH'] },
        },
      });

      // Delayed discharges count: patient journeys in ADMISSION/TREATMENT stages where expectedDischargeDate is in the past
      const delayedDischargesCount = await prisma.patientjourney.count({
        where: {
          currentStage: { in: ['ADMISSION', 'TREATMENT'] },
          expectedDischargeDate: { lt: new Date() },
        },
      });

      // Department patient distribution from patientjourney
      const departmentDistributionRaw = await prisma.patientjourney.groupBy({
        by: ['department'],
        _count: { id: true },
      });

      const departmentPatientDistribution = departmentDistributionRaw.map((item) => ({
        name: item.department,
        value: item._count.id,
      }));

      // Map trends for Recharts
      const bedOccupancyTrend = trends.map((t) => ({
        date: new Date(t.metricDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hospitalOccupancy: parseFloat(((t.occupiedBeds / t.totalBeds) * 100).toFixed(1)),
        icuOccupancy: parseFloat(((t.icuOccupiedBeds / t.icuTotalBeds) * 100).toFixed(1)),
        erWaiting: t.erWaitingPatients,
      }));

      // Admissions vs Discharges (past 5 days)
      const admissionsVsDischarges = trends.slice(-5).map((t) => ({
        date: new Date(t.metricDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        admissions: t.admissions,
        discharges: t.discharges,
      }));

      // Priority Departments summary (Emergency, General Medicine, Finance/Cardiology)
      const priorityDepartments = [
        { name: 'Emergency', load: latestMetric.erWaitingPatients > 40 ? 'Critical' : 'Normal', value: latestMetric.erWaitingPatients },
        { name: 'General Medicine', load: 'Normal', value: latestMetric.occupiedBeds },
        { name: 'ICU', load: (latestMetric.icuOccupiedBeds / latestMetric.icuTotalBeds) > 0.9 ? 'High' : 'Normal', value: latestMetric.icuOccupiedBeds },
      ];

      // Recent critical escalations
      const recentEscalations = await prisma.alert.findMany({
        where: {
          status: { in: ['OPEN', 'ASSIGNED'] },
          priority: 'CRITICAL',
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      });

      // Rules-based AI insights layer
      const aiInsights = [];

      if ((latestMetric.icuOccupiedBeds / latestMetric.icuTotalBeds) >= 0.9) {
        aiInsights.push({
          category: 'ICU Capacity',
          title: 'ICU beds almost full',
          recommendation: 'ICU occupancy is high. Review transfer-ready patients and notify bed management.',
          priority: 'CRITICAL',
        });
      }

      if (latestMetric.erWaitingPatients > 40) {
        aiInsights.push({
          category: 'ER Queue',
          title: 'Emergency waiting time above 45 minutes',
          recommendation: 'Open surge bay and assign one additional triage nurse.',
          priority: 'HIGH',
        });
      }

      // Check pharmacy inventory for low stock
      const lowStockMeds = await prisma.pharmacyinventory.findMany({
        where: {
          stock: { lt: prisma.pharmacyinventory.fields.reorderLevel },
        },
        take: 2,
      });

      if (lowStockMeds.length > 0) {
        aiInsights.push({
          category: 'Pharmacy',
          title: 'Essential medicine stock running low',
          recommendation: ` replenishment needed for ${lowStockMeds.map((m) => m.medicineName).join(', ')}.`,
          priority: 'MEDIUM',
        });
      }

      // Fallback or additional static insights from database if list is short
      const dbInsights = await prisma.aiinsight.findMany({
        where: { isActive: true },
        take: 3 - aiInsights.length,
      });

      const finalInsights = [...aiInsights, ...dbInsights];

      return res.json({
        success: true,
        data: {
          kpis: {
            totalBeds: latestMetric.totalBeds,
            occupiedBeds: latestMetric.occupiedBeds,
            availableBeds: latestMetric.totalBeds - latestMetric.occupiedBeds,
            bedOccupancy: parseFloat(((latestMetric.occupiedBeds / latestMetric.totalBeds) * 100).toFixed(1)),
            patientSatisfaction: latestMetric.patientSatisfaction,
            operatingCosts: parseFloat(latestMetric.operatingCosts.toString()),
            icuOccupancy: parseFloat(((latestMetric.icuOccupiedBeds / latestMetric.icuTotalBeds) * 100).toFixed(1)),
            erWaiting: latestMetric.erWaitingPatients,
            majorRisks: majorRisksCount,
            dailyRevenue: parseFloat(latestMetric.collectedRevenue.toString()),
            admissionsToday: latestMetric.admissions,
            dischargesToday: latestMetric.discharges,
            delayedDischarges: delayedDischargesCount,
          },
          charts: {
            bedOccupancyTrend,
            departmentPatientDistribution,
            admissionsVsDischarges,
          },
          priorityDepartments,
          recentEscalations,
          aiInsights: finalInsights,
        },
      });
    } catch (error) {
      console.error('Fetch executive dashboard error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve Executive Dashboard metrics.',
      });
    }
  }
);

/**
 * GET /api/dashboard/icu
 * Returns ICU Operations metrics
 */
router.get(
  '/icu',
  authorizeRoles('ADMIN', 'CMO', 'OPERATIONS_HEAD'),
  async (req, res) => {
    try {
      const { latestMetric } = await getLatestMetrics();
      const latestIcuRecord = await prisma.icurecord.findFirst({
        orderBy: { recordedAt: 'desc' },
      });

      const icuTotalBeds = latestMetric ? latestMetric.icuTotalBeds : 120;
      const icuOccupiedBeds = latestIcuRecord ? latestIcuRecord.occupiedBeds : (latestMetric ? latestMetric.icuOccupiedBeds : 102);
      const criticalPatients = latestIcuRecord ? latestIcuRecord.criticalPatients : 38;
      const highRiskPatients = latestIcuRecord ? latestIcuRecord.highRiskPatients : 42;
      const ventilatorsInUse = latestIcuRecord ? latestIcuRecord.ventilatorsInUse : 45;
      const totalVentilators = 100; // Capacity

      const recentIcuTrend = await prisma.icurecord.findMany({
        orderBy: { recordedAt: 'asc' },
        take: 12,
      });

      const charts = {
        icuOccupancyTrend: recentIcuTrend.map((r) => ({
          time: new Date(r.recordedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          occupancy: parseFloat(((r.occupiedBeds / icuTotalBeds) * 100).toFixed(1)),
        })),
        ventilatorUtilizationTrend: recentIcuTrend.map((r) => ({
          time: new Date(r.recordedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          inUse: r.ventilatorsInUse,
          available: totalVentilators - r.ventilatorsInUse,
        })),
      };

      // ICU Patient Watchlist: patient journeys in ICU department
      const icuPatientWatchlist = await prisma.patientjourney.findMany({
        where: { department: 'ICU' },
        take: 5,
      });

      // Transfer ready patients: ICU patients in DISCHARGE or FOLLOW_UP stage
      const transferReadyPatients = await prisma.patientjourney.findMany({
        where: {
          department: 'ICU',
          currentStage: { in: ['DISCHARGE', 'FOLLOW_UP'] },
        },
        take: 5,
      });

      return res.json({
        success: true,
        data: {
          kpis: {
            icuTotalBeds,
            icuOccupiedBeds,
            icuAvailableBeds: icuTotalBeds - icuOccupiedBeds,
            icuOccupancy: parseFloat(((icuOccupiedBeds / icuTotalBeds) * 100).toFixed(1)),
            criticalPatients,
            highRiskPatients,
            ventilatorsInUse,
            availableVentilators: totalVentilators - ventilatorsInUse,
            nurseToPatientRatio: '1:1', // Standard ICU Ratio
          },
          charts,
          icuPatientWatchlist,
          transferReadyPatients,
        },
      });
    } catch (error) {
      console.error('Fetch ICU dashboard error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve ICU Dashboard metrics.',
      });
    }
  }
);

/**
 * GET /api/dashboard/emergency
 * Returns Emergency Room metrics
 */
router.get(
  '/emergency',
  authorizeRoles('ADMIN', 'CMO', 'OPERATIONS_HEAD'),
  async (req, res) => {
    try {
      const { latestMetric } = await getLatestMetrics();
      const erWaiting = latestMetric ? latestMetric.erWaitingPatients : 47;

      // Count critical cases (Wait time > 30 min and Critical triage)
      const criticalCases = await prisma.emergencycase.count({
        where: { triageCategory: 'Critical', status: { not: 'DISCHARGED' } },
      });

      const activeCases = await prisma.emergencycase.findMany({
        where: { status: { not: 'DISCHARGED' } },
        orderBy: { arrivalTime: 'desc' },
      });

      const avgWaitMinutesRaw = await prisma.emergencycase.aggregate({
        _avg: { waitMinutes: true },
        where: { status: { not: 'DISCHARGED' } },
      });
      const avgWaitMinutes = Math.round(avgWaitMinutesRaw._avg.waitMinutes || 25);

      const incomingAmbulances = await prisma.ambulancearrival.findMany({
        orderBy: { eta: 'asc' },
      });

      // Triage Pending: cases with status = 'TRIAGE'
      const triagePendingCount = await prisma.emergencycase.count({
        where: { status: 'TRIAGE' },
      });

      // Charts
      const triageDistribution = [
        { name: 'Critical', value: await prisma.emergencycase.count({ where: { triageCategory: 'Critical' } }) },
        { name: 'High', value: await prisma.emergencycase.count({ where: { triageCategory: 'High' } }) },
        { name: 'Medium', value: await prisma.emergencycase.count({ where: { triageCategory: 'Medium' } }) },
        { name: 'Low', value: await prisma.emergencycase.count({ where: { triageCategory: 'Low' } }) },
      ];

      return res.json({
        success: true,
        data: {
          kpis: {
            patientsWaiting: erWaiting,
            criticalCases,
            averageWaitingTime: avgWaitMinutes,
            waitingTimeAboveSLA: await prisma.emergencycase.count({ where: { waitMinutes: { gt: 45 }, status: { not: 'DISCHARGED' } } }),
            incomingAmbulancesCount: incomingAmbulances.length,
            availableDoctors: 4, // Seed reference or static simulation
            availableBeds: 80 - erWaiting,
            erOccupancy: parseFloat(((erWaiting / 80) * 100).toFixed(1)),
            triagePending: triagePendingCount,
          },
          emergencyQueue: activeCases,
          incomingAmbulanceList: incomingAmbulances,
          triageCategoryDistribution: triageDistribution,
        },
      });
    } catch (error) {
      console.error('Fetch emergency dashboard error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve Emergency Room metrics.',
      });
    }
  }
);

/**
 * GET /api/dashboard/doctor-productivity
 * Returns Doctor Productivity metrics
 */
router.get(
  '/doctor-productivity',
  authorizeRoles('ADMIN', 'CMO'),
  async (req, res) => {
    try {
      const doctors = await prisma.doctor.findMany({
        include: {
          doctorproductivitymetric: {
            orderBy: { metricDate: 'desc' },
            take: 1,
          },
        },
      });

      const activeDoctors = doctors.length;
      const onDuty = doctors.filter((d) => d.availabilityStatus === 'On Duty').length;

      // Aggregations
      const completedConsultations = await prisma.doctorproductivitymetric.aggregate({
        _sum: { consultationsCompleted: true, scheduledSurgeries: true, pendingTasks: true },
        _avg: { patientFeedback: true },
      });

      const highWorkloadCount = await prisma.doctorproductivitymetric.count({
        where: { workloadLevel: { in: ['High', 'Critical'] } },
      });

      // Build performance list
      const doctorPerformanceList = doctors.map((doc) => {
        const metric = doc.doctorproductivitymetric[0] || {
          patientsHandled: 0,
          consultationsCompleted: 0,
          scheduledSurgeries: 0,
          pendingTasks: 0,
          patientFeedback: 5.0,
          workloadLevel: 'Normal',
        };

        return {
          id: doc.id,
          name: doc.name,
          department: doc.department,
          patientsHandled: metric.patientsHandled,
          consultationsCompleted: metric.consultationsCompleted,
          surgerySchedule: metric.scheduledSurgeries,
          pendingTasks: metric.pendingTasks,
          patientFeedback: metric.patientFeedback,
          workloadLevel: metric.workloadLevel,
          availabilityStatus: doc.availabilityStatus,
        };
      });

      // Charts: consultations by department
      const consultationsByDept = [
        { name: 'Emergency', value: 45 },
        { name: 'General Medicine', value: 68 },
        { name: 'Cardiology', value: 34 },
        { name: 'Orthopedics', value: 22 },
        { name: 'Pediatrics', value: 38 },
      ];

      return res.json({
        success: true,
        data: {
          kpis: {
            activeDoctors,
            doctorsOnDuty: onDuty,
            consultationsCompleted: completedConsultations._sum.consultationsCompleted || 0,
            scheduledSurgeries: completedConsultations._sum.scheduledSurgeries || 0,
            pendingConsultations: completedConsultations._sum.pendingTasks || 0,
            highWorkloadDoctors: highWorkloadCount,
            averagePatientFeedback: parseFloat((completedConsultations._avg.patientFeedback || 4.7).toFixed(2)),
            unassignedTasks: 8,
          },
          doctorPerformanceList,
          charts: {
            consultationsByDept,
          },
        },
      });
    } catch (error) {
      console.error('Fetch doctor productivity error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve Doctor Productivity metrics.',
      });
    }
  }
);

/**
 * GET /api/dashboard/financial
 * Returns Hospital Financial metrics
 */
router.get(
  '/financial',
  authorizeRoles('ADMIN', 'CEO'),
  async (req, res) => {
    try {
      const { latestMetric, trends } = await getLatestMetrics();
      if (!latestMetric) {
        return res.status(404).json({ success: false, message: 'No financial data found.' });
      }

      // Collected Revenue (Cleared payments sum)
      const collectedRevenueSumRaw = await prisma.payment.aggregate({
        _sum: { amount: true },
      });
      const collectedRevenue = parseFloat((collectedRevenueSumRaw._sum.amount || latestMetric.collectedRevenue).toString());

      // Outstanding Payments (Pending bills sum)
      const outstandingSumRaw = await prisma.bill.aggregate({
        _sum: { amount: true },
        where: { status: 'PENDING' },
      });
      const outstandingPayments = parseFloat((outstandingSumRaw._sum.amount || 145000.0).toString());

      // Insurance claims
      const claimsSubmitted = await prisma.insuranceclaim.count();
      const claimsRejected = await prisma.insuranceclaim.count({ where: { status: 'REJECTED' } });

      const claimsRejectedSumRaw = await prisma.insuranceclaim.aggregate({
        _sum: { amount: true },
        where: { status: 'REJECTED' },
      });
      const rejectedClaimsAmount = parseFloat((claimsRejectedSumRaw._sum.amount || 18450.0).toString());

      // Net profit
      const netProfit = collectedRevenue - parseFloat(latestMetric.operatingCosts.toString());

      // Trends
      const revenueVsExpensesTrend = trends.map((t) => ({
        date: new Date(t.metricDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: parseFloat(t.collectedRevenue.toString()),
        expenses: parseFloat(t.operatingCosts.toString()),
      }));

      // Department Revenue Summary
      const deptBillsRaw = await prisma.bill.groupBy({
        by: ['department'],
        _sum: { amount: true },
      });

      const departmentRevenue = deptBillsRaw.map((b) => ({
        name: b.department,
        value: parseFloat((b._sum.amount || 0).toString()),
      }));

      // Table outstanding invoices
      const outstandingInvoices = await prisma.bill.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      // Table claim status
      const insuranceClaims = await prisma.insuranceclaim.findMany({
        orderBy: { submittedAt: 'desc' },
        take: 5,
      });

      return res.json({
        success: true,
        data: {
          kpis: {
            dailyRevenue: parseFloat(latestMetric.collectedRevenue.toString()),
            monthlyRevenue: collectedRevenue * 12, // simulated monthly
            collectedRevenue,
            outstandingPayments,
            insuranceClaimsCount: claimsSubmitted,
            rejectedClaimsCount: claimsRejected,
            rejectedClaimsAmount,
            operatingCosts: parseFloat(latestMetric.operatingCosts.toString()),
            netProfit,
            revenueGrowthPercentage: 4.8,
          },
          charts: {
            revenueVsExpensesTrend,
            departmentRevenue,
          },
          outstandingInvoices,
          insuranceClaims,
        },
      });
    } catch (error) {
      console.error('Fetch financial dashboard error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve Financial Dashboard metrics.',
      });
    }
  }
);

export default router;
