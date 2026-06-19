import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Ensure default users exist
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123', salt);

  const defaultUsers = [
    { fullName: 'System Administrator', email: 'admin@northstar.test', role: 'ADMIN' },
    { fullName: 'Morgan Ellis', email: 'ceo@northstar.test', role: 'CEO' },
    { fullName: 'Dr. Priya Sharma', email: 'cmo@northstar.test', role: 'CMO' },
    { fullName: 'Daniel Brooks', email: 'operations@northstar.test', role: 'OPERATIONS_HEAD' },
  ];

  for (const u of defaultUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash },
      create: {
        fullName: u.fullName,
        email: u.email,
        passwordHash,
        role: u.role,
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }
  console.log('Default users verified.');

  // 2. Wards and Beds
  const wardCount = await prisma.ward.count();
  if (wardCount === 0) {
    const wardsData = [
      { name: 'General Medicine Ward', capacity: 400, occupied: 320 },
      { name: 'ICU Ward A', capacity: 60, occupied: 52 },
      { name: 'ICU Ward B', capacity: 60, occupied: 50 },
      { name: 'Emergency Observation', capacity: 80, occupied: 47 },
      { name: 'Cardiology Ward', capacity: 150, occupied: 120 },
      { name: 'Pediatrics Ward', capacity: 100, occupied: 70 },
      { name: 'Neurology Ward', capacity: 150, occupied: 115 },
    ];
    for (const w of wardsData) {
      await prisma.ward.create({ data: w });
    }

    // Populate a sample of beds
    const bedTypes = ['Standard', 'ICU', 'Semi-Private', 'Private'];
    for (let i = 1; i <= 50; i++) {
      await prisma.bed.create({
        data: {
          bedNumber: `B-${100 + i}`,
          ward: i <= 20 ? 'General Medicine Ward' : i <= 35 ? 'ICU Ward A' : 'Cardiology Ward',
          type: i <= 20 ? 'Standard' : i <= 35 ? 'ICU' : 'Private',
          status: i % 5 === 0 ? 'Available' : 'Occupied',
        },
      });
    }
    console.log('Wards and beds seeded.');
  }

  // 3. ICU records
  const icuCount = await prisma.icurecord.count();
  if (icuCount === 0) {
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const recordedAt = new Date(now.getTime() - i * 60 * 60 * 1000); // Hourly records for the last 24h
      await prisma.icurecord.create({
        data: {
          recordedAt,
          occupiedBeds: 102 - (i % 5),
          ventilatorsInUse: 45 + (i % 8) - (i % 3),
          criticalPatients: 38 + (i % 4),
          highRiskPatients: 42 - (i % 6),
        },
      });
    }
    console.log('ICU records seeded.');
  }

  // 4. Emergency cases
  const erCount = await prisma.emergencycase.count();
  if (erCount === 0) {
    const triageCategories = ['Critical', 'High', 'Medium', 'Low'];
    const statuses = ['WAITING', 'TRIAGE', 'TREATMENT', 'DISCHARGED'];
    for (let i = 1; i <= 20; i++) {
      const category = triageCategories[i % 4];
      await prisma.emergencycase.create({
        data: {
          caseNumber: `ER-${20000 + i}`,
          triageCategory: category,
          arrivalTime: new Date(Date.now() - i * 15 * 60 * 1000), // arrivals every 15 mins
          status: i % 4 === 0 ? 'WAITING' : statuses[i % 4],
          waitMinutes: i % 4 === 0 ? 50 + (i * 2) : 10 + (i * 2),
        },
      });
    }
    console.log('Emergency cases seeded.');
  }

  // 5. Ambulance arrivals
  const ambCount = await prisma.ambulancearrival.count();
  if (ambCount === 0) {
    const triageCategories = ['Critical', 'High', 'Medium'];
    for (let i = 1; i <= 6; i++) {
      await prisma.ambulancearrival.create({
        data: {
          vehicleCode: `AMB-${100 + i}`,
          eta: new Date(Date.now() + i * 12 * 60 * 1000), // Incoming ETAs
          triageCategory: triageCategories[i % 3],
          patientCount: (i % 2) + 1,
        },
      });
    }
    console.log('Ambulance arrivals seeded.');
  }

  // 6. Doctor productivity metrics
  const docProdCount = await prisma.doctorproductivitymetric.count();
  if (docProdCount === 0) {
    const doctors = await prisma.doctor.findMany();
    const workloadLevels = ['Normal', 'Moderate', 'High', 'Critical'];
    for (const doc of doctors) {
      await prisma.doctorproductivitymetric.create({
        data: {
          doctorId: doc.id,
          metricDate: new Date(),
          patientsHandled: 15 + (doc.id % 3) * 5,
          consultationsCompleted: 12 + (doc.id % 3) * 4,
          scheduledSurgeries: doc.id % 3 === 0 ? 2 : doc.id % 4 === 0 ? 1 : 0,
          pendingTasks: doc.id % 3 === 0 ? 8 : 2,
          patientFeedback: 4.2 + (doc.id % 5) * 0.15,
          workloadLevel: workloadLevels[doc.id % 4],
        },
      });
    }
    console.log('Doctor productivity metrics seeded.');
  }

  // 7. Pharmacy Inventory
  const pharmacyCount = await prisma.pharmacyinventory.count();
  if (pharmacyCount === 0) {
    const medicines = [
      { medicineName: 'Aspirin 81mg', stock: 450, reorderLevel: 100 },
      { medicineName: 'Insulin Glargine 100U', stock: 45, reorderLevel: 50 }, // Low stock trigger
      { medicineName: 'Paracetamol 500mg', stock: 1200, reorderLevel: 200 },
      { medicineName: 'Amoxicillin 500mg', stock: 80, reorderLevel: 100 }, // Low stock trigger
      { medicineName: 'Atorvastatin 20mg', stock: 350, reorderLevel: 75 },
      { medicineName: 'Metformin 500mg', stock: 600, reorderLevel: 100 },
      { medicineName: 'Epinephrine 1mg/ml', stock: 12, reorderLevel: 20 }, // Critical stock trigger
      { medicineName: 'Ibuprofen 400mg', stock: 800, reorderLevel: 150 },
    ];
    for (const med of medicines) {
      await prisma.pharmacyinventory.create({
        data: {
          medicineName: med.medicineName,
          stock: med.stock,
          reorderLevel: med.reorderLevel,
          updatedAt: new Date(),
        },
      });
    }
    console.log('Pharmacy inventory seeded.');
  }

  // 8. Bills, Payments, Insurance Claims
  const billCount = await prisma.bill.count();
  if (billCount === 0) {
    const departments = ['Emergency', 'General Medicine', 'Cardiology', 'Surgery'];
    for (let i = 1; i <= 15; i++) {
      const amount = 500 + i * 250;
      const invoiceNumber = `INV-2026-${1000 + i}`;
      await prisma.bill.create({
        data: {
          invoiceNumber,
          amount,
          status: i % 3 === 0 ? 'PENDING' : i % 3 === 1 ? 'CLEARED' : 'INSURANCE_REVIEW',
          department: departments[i % 4],
          createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        },
      });

      if (i % 3 === 1) {
        await prisma.payment.create({
          data: {
            reference: `PAY-REF-${5000 + i}`,
            amount,
            method: i % 2 === 0 ? 'Credit Card' : 'Bank Transfer',
            paidAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
          },
        });
      }

      if (i % 3 === 2) {
        await prisma.insuranceclaim.create({
          data: {
            claimNumber: `CLM-${9000 + i}`,
            amount,
            status: i % 4 === 0 ? 'REJECTED' : 'PENDING',
            submittedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
          },
        });
      }
    }
    console.log('Billing, payments and insurance claims seeded.');
  }

  // 9. AI Insights
  const aiCount = await prisma.aiinsight.count();
  if (aiCount === 0) {
    const insights = [
      {
        category: 'ICU',
        title: 'ICU Bed Occupancy Warning',
        recommendation: 'ICU occupancy is at 90.2%. Review transfer-ready patients and notify bed management to prepare additional step-down capacity.',
        priority: 'HIGH',
        isActive: true,
      },
      {
        category: 'EMERGENCY',
        title: 'ER Surge Alert',
        recommendation: 'Emergency room waiting time is above 45 minutes SLA. Recommend opening a surge triage bay and adding one backup triage nurse.',
        priority: 'CRITICAL',
        isActive: true,
      },
      {
        category: 'PHARMACY',
        title: 'Critical Medication Shortage',
        recommendation: 'Epinephrine and Insulin stock levels are below reorder thresholds. Trigger emergency replenishment and coordinate with clinical teams for substitutes.',
        priority: 'HIGH',
        isActive: true,
      },
      {
        category: 'DISCHARGE',
        title: 'Discharge Delays Detected',
        recommendation: '6 patients are ready for discharge but delayed due to pending laboratory results or billing clearance. Coordinate with social work and lab coordinators.',
        priority: 'MEDIUM',
        isActive: true,
      },
      {
        category: 'STAFFING',
        title: 'Doctor Workload Imbalance',
        recommendation: 'Emergency and Surgery physicians are experiencing critical workload levels. Recommend redistributing non-critical consults to general medicine staff.',
        priority: 'MEDIUM',
        isActive: true,
      },
    ];
    for (const ins of insights) {
      await prisma.aiinsight.create({ data: ins });
    }
    console.log('AI Insights seeded.');
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
