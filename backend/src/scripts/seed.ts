import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Loan } from '../models/Loan.js';
import { Payment } from '../models/Payment.js';
import { Lead, LeadStatus } from '../models/Lead.js';
import { AuditLog } from '../models/AuditLog.js';
import { UserRole, LoanStatus, EmploymentMode } from '../constants/index.js';
import { LoanMathService } from '../services/loanMathService.js';
import { BREService } from '../services/breService.js';

dotenv.config();

const SEED_PASSWORD = 'Password@123';

export const seedDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lms_db';
    console.log(`[Seed] Connecting to ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('[Seed] Clearing existing database collections...');
    await Promise.all([
      User.deleteMany({}),
      Loan.deleteMany({}),
      Payment.deleteMany({}),
      Lead.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('[Seed] Creating core users for all roles...');

    // 1. Create Core Users
    const admin = await User.create({
      name: 'Aditya Birla (Admin)',
      email: 'admin@lms.com',
      password: SEED_PASSWORD,
      role: UserRole.ADMIN,
      phone: '+91 98765 00001',
    });

    const salesExec = await User.create({
      name: 'Sanjay Kapoor (Sales)',
      email: 'sales@lms.com',
      password: SEED_PASSWORD,
      role: UserRole.SALES,
      phone: '+91 98765 00002',
    });

    const sanctionExec = await User.create({
      name: 'Ananya Verma (Sanction)',
      email: 'sanction@lms.com',
      password: SEED_PASSWORD,
      role: UserRole.SANCTION,
      phone: '+91 98765 00003',
    });

    const disbursementExec = await User.create({
      name: 'Vikram Malhotra (Disbursement)',
      email: 'disbursement@lms.com',
      password: SEED_PASSWORD,
      role: UserRole.DISBURSEMENT,
      phone: '+91 98765 00004',
    });

    const collectionExec = await User.create({
      name: 'Pooja Hegde (Collection)',
      email: 'collection@lms.com',
      password: SEED_PASSWORD,
      role: UserRole.COLLECTION,
      phone: '+91 98765 00005',
    });

    // Borrower 1: Active borrower with an active disbursed loan
    const borrower1 = await User.create({
      name: 'Rahul Sharma',
      email: 'borrower@lms.com',
      password: SEED_PASSWORD,
      role: UserRole.BORROWER,
      phone: '+91 98220 12345',
      pan: 'ABCDE1234F',
      dateOfBirth: new Date('1994-05-15'), // Age 32
      monthlySalary: 65000,
      employmentMode: EmploymentMode.SALARIED,
      applicationStepCompleted: 4,
    });

    // Borrower 2: Lead who just registered (for Sales pipeline testing)
    const borrower2 = await User.create({
      name: 'Priya Patel',
      email: 'priya@example.com',
      password: SEED_PASSWORD,
      role: UserRole.BORROWER,
      phone: '+91 98330 54321',
      pan: 'BKRPP9876K',
      dateOfBirth: new Date('1998-08-20'), // Age 28
      monthlySalary: 42000,
      employmentMode: EmploymentMode.SALARIED,
      applicationStepCompleted: 1,
    });

    // Borrower 3: Applicant in Sanction queue
    const borrower3 = await User.create({
      name: 'Vikram Joshi',
      email: 'vikram.joshi@example.com',
      password: SEED_PASSWORD,
      role: UserRole.BORROWER,
      phone: '+91 98440 67890',
      pan: 'XYZAB5678M',
      dateOfBirth: new Date('1988-11-10'), // Age 37
      monthlySalary: 85000,
      employmentMode: EmploymentMode.SALARIED,
      applicationStepCompleted: 4,
    });

    // Borrower 4: Applicant in Disbursement queue
    const borrower4 = await User.create({
      name: 'Neha Singh',
      email: 'neha.singh@example.com',
      password: SEED_PASSWORD,
      role: UserRole.BORROWER,
      phone: '+91 98550 11223',
      pan: 'LKJHG4321P',
      dateOfBirth: new Date('1992-03-25'), // Age 34
      monthlySalary: 72000,
      employmentMode: EmploymentMode.SELF_EMPLOYED,
      applicationStepCompleted: 4,
    });

    console.log('[Seed] Creating Leads for Sales module...');
    // Seed Leads
    await Lead.create([
      {
        borrowerId: borrower2._id,
        name: borrower2.name,
        email: borrower2.email,
        phone: borrower2.phone,
        currentStep: 1,
        leadStatus: LeadStatus.NEW,
        assignedTo: salesExec._id,
        assignedToName: salesExec.name,
        hasApplied: false,
        notes: [
          {
            note: 'Lead generated via website sign-up. Needs assistance with Step 2 (BRE details).',
            addedBy: salesExec._id,
            addedByName: salesExec.name,
            addedAt: new Date(Date.now() - 3600000 * 4),
          },
        ],
      },
      {
        borrowerId: new mongoose.Types.ObjectId(),
        name: 'Amit Verma',
        email: 'amit.verma@example.com',
        phone: '+91 98660 99887',
        currentStep: 2,
        leadStatus: LeadStatus.CONTACTED,
        assignedTo: salesExec._id,
        assignedToName: salesExec.name,
        hasApplied: false,
        notes: [
          {
            note: 'Called borrower. Salary is ₹35,000. Customer promised to upload salary slip tonight.',
            addedBy: salesExec._id,
            addedByName: salesExec.name,
            addedAt: new Date(Date.now() - 3600000 * 2),
          },
        ],
      },
      {
        borrowerId: new mongoose.Types.ObjectId(),
        name: 'Sunita Rao',
        email: 'sunita.rao@example.com',
        phone: '+91 98770 33445',
        currentStep: 3,
        leadStatus: LeadStatus.FOLLOW_UP_REQUIRED,
        assignedTo: salesExec._id,
        assignedToName: salesExec.name,
        hasApplied: false,
        notes: [
          {
            note: 'Uploaded salary slip. Needs quick assistance choosing loan tenure slider.',
            addedBy: salesExec._id,
            addedByName: salesExec.name,
            addedAt: new Date(Date.now() - 3600000 * 1),
          },
        ],
      },
    ]);

    console.log('[Seed] Creating Loans across all lifecycle stages...');

    // 1. APPLIED Loan (Ready for Sanction review)
    const calcApplied = LoanMathService.calculate(150000, 180);
    const breApplied = BREService.evaluate({
      fullName: borrower3.name,
      pan: borrower3.pan || 'XYZAB5678M',
      dateOfBirth: borrower3.dateOfBirth || new Date('1988-11-10'),
      monthlySalary: borrower3.monthlySalary || 85000,
      employmentMode: borrower3.employmentMode || EmploymentMode.SALARIED,
    });

    const loanApplied = await Loan.create({
      loanId: 'LN-20261009-0001',
      borrowerId: borrower3._id,
      applicantDetails: {
        fullName: borrower3.name,
        email: borrower3.email,
        pan: borrower3.pan || 'XYZAB5678M',
        dateOfBirth: borrower3.dateOfBirth || new Date('1988-11-10'),
        age: breApplied.age,
        monthlySalary: borrower3.monthlySalary || 85000,
        employmentMode: borrower3.employmentMode || EmploymentMode.SALARIED,
      },
      salarySlip: {
        filename: 'sample_salary_slip_vikram.pdf',
        originalName: 'Salary_Slip_September_2026.pdf',
        path: 'uploads/sample_salary_slip.pdf',
        mimetype: 'application/pdf',
        size: 245000,
        uploadedAt: new Date(Date.now() - 3600000 * 5),
      },
      loanConfig: {
        amount: calcApplied.principal,
        tenureDays: calcApplied.tenureDays,
        interestRate: calcApplied.annualInterestRate,
        interestAmount: calcApplied.interestAmount,
        totalRepayment: calcApplied.totalRepayment,
      },
      breResult: {
        passed: true,
        age: breApplied.age,
        checks: breApplied.checks,
        rejectionReasons: [],
        evaluatedAt: new Date(Date.now() - 3600000 * 5),
      },
      status: LoanStatus.APPLIED,
      statusHistory: [
        {
          status: LoanStatus.APPLIED,
          changedBy: borrower3._id,
          changedByName: borrower3.name,
          changedByRole: UserRole.BORROWER,
          timestamp: new Date(Date.now() - 3600000 * 5),
          remarks: 'Applicant submitted loan application online.',
        },
      ],
      repaymentDetails: {
        totalRepayment: calcApplied.totalRepayment,
        totalPaid: 0,
        outstandingBalance: calcApplied.totalRepayment,
      },
    });

    // 2. SANCTIONED Loan (Ready for Disbursement)
    const calcSanctioned = LoanMathService.calculate(200000, 120);
    const breSanctioned = BREService.evaluate({
      fullName: borrower4.name,
      pan: borrower4.pan || 'LKJHG4321P',
      dateOfBirth: borrower4.dateOfBirth || new Date('1992-03-25'),
      monthlySalary: borrower4.monthlySalary || 72000,
      employmentMode: borrower4.employmentMode || EmploymentMode.SELF_EMPLOYED,
    });

    const loanSanctioned = await Loan.create({
      loanId: 'LN-20261009-0002',
      borrowerId: borrower4._id,
      applicantDetails: {
        fullName: borrower4.name,
        email: borrower4.email,
        pan: borrower4.pan || 'LKJHG4321P',
        dateOfBirth: borrower4.dateOfBirth || new Date('1992-03-25'),
        age: breSanctioned.age,
        monthlySalary: borrower4.monthlySalary || 72000,
        employmentMode: borrower4.employmentMode || EmploymentMode.SELF_EMPLOYED,
      },
      salarySlip: {
        filename: 'sample_salary_slip_neha.pdf',
        originalName: 'Form16_IncomeProof.pdf',
        path: 'uploads/sample_salary_slip.pdf',
        mimetype: 'application/pdf',
        size: 310000,
        uploadedAt: new Date(Date.now() - 3600000 * 24),
      },
      loanConfig: {
        amount: calcSanctioned.principal,
        tenureDays: calcSanctioned.tenureDays,
        interestRate: calcSanctioned.annualInterestRate,
        interestAmount: calcSanctioned.interestAmount,
        totalRepayment: calcSanctioned.totalRepayment,
      },
      breResult: {
        passed: true,
        age: breSanctioned.age,
        checks: breSanctioned.checks,
        rejectionReasons: [],
        evaluatedAt: new Date(Date.now() - 3600000 * 24),
      },
      status: LoanStatus.SANCTIONED,
      sanctionDetails: {
        sanctionedBy: sanctionExec._id,
        sanctionedByName: sanctionExec.name,
        sanctionedAt: new Date(Date.now() - 3600000 * 12),
        approvedAmount: 200000,
        remarks: 'Salary slip and income documents verified. CIBIL score satisfactory. Sanction approved.',
      },
      statusHistory: [
        {
          status: LoanStatus.APPLIED,
          changedBy: borrower4._id,
          changedByName: borrower4.name,
          changedByRole: UserRole.BORROWER,
          timestamp: new Date(Date.now() - 3600000 * 24),
          remarks: 'Application submitted.',
        },
        {
          status: LoanStatus.SANCTIONED,
          changedBy: sanctionExec._id,
          changedByName: sanctionExec.name,
          changedByRole: UserRole.SANCTION,
          timestamp: new Date(Date.now() - 3600000 * 12),
          remarks: 'Sanction approved for ₹2,00,000.',
        },
      ],
      repaymentDetails: {
        totalRepayment: calcSanctioned.totalRepayment,
        totalPaid: 0,
        outstandingBalance: calcSanctioned.totalRepayment,
      },
    });

    // 3. DISBURSED Loan (Active loan for Collection executive testing & borrower1 tracking)
    const calcDisbursed = LoanMathService.calculate(100000, 90);
    const breDisbursed = BREService.evaluate({
      fullName: borrower1.name,
      pan: borrower1.pan || 'ABCDE1234F',
      dateOfBirth: borrower1.dateOfBirth || new Date('1994-05-15'),
      monthlySalary: borrower1.monthlySalary || 65000,
      employmentMode: borrower1.employmentMode || EmploymentMode.SALARIED,
    });

    const initialTotalRepayment = calcDisbursed.totalRepayment; // 100,000 + (100000 * 12 * 90 / 36500) = 102,958.90
    const partialPayment1 = 25000;
    const remainingOutstanding = Math.round((initialTotalRepayment - partialPayment1) * 100) / 100;

    const loanDisbursed = await Loan.create({
      loanId: 'LN-20261009-0003',
      borrowerId: borrower1._id,
      applicantDetails: {
        fullName: borrower1.name,
        email: borrower1.email,
        pan: borrower1.pan || 'ABCDE1234F',
        dateOfBirth: borrower1.dateOfBirth || new Date('1994-05-15'),
        age: breDisbursed.age,
        monthlySalary: borrower1.monthlySalary || 65000,
        employmentMode: borrower1.employmentMode || EmploymentMode.SALARIED,
      },
      salarySlip: {
        filename: 'sample_salary_slip_rahul.png',
        originalName: 'Salary_Slip_August.png',
        path: 'uploads/sample_salary_slip.pdf',
        mimetype: 'image/png',
        size: 180000,
        uploadedAt: new Date(Date.now() - 3600000 * 72),
      },
      loanConfig: {
        amount: calcDisbursed.principal,
        tenureDays: calcDisbursed.tenureDays,
        interestRate: calcDisbursed.annualInterestRate,
        interestAmount: calcDisbursed.interestAmount,
        totalRepayment: calcDisbursed.totalRepayment,
      },
      breResult: {
        passed: true,
        age: breDisbursed.age,
        checks: breDisbursed.checks,
        rejectionReasons: [],
        evaluatedAt: new Date(Date.now() - 3600000 * 72),
      },
      status: LoanStatus.DISBURSED,
      sanctionDetails: {
        sanctionedBy: sanctionExec._id,
        sanctionedByName: sanctionExec.name,
        sanctionedAt: new Date(Date.now() - 3600000 * 48),
        approvedAmount: 100000,
        remarks: 'KYC verified. Credit profile eligible.',
      },
      disbursementDetails: {
        disbursedBy: disbursementExec._id,
        disbursedByName: disbursementExec.name,
        disbursedAt: new Date(Date.now() - 3600000 * 24),
        disbursementReference: 'DISB-HDFC-99881122',
        disbursedAmount: 100000,
        bankAccountNumber: 'HDFC0002847192',
        bankIfsc: 'HDFC0000123',
      },
      statusHistory: [
        {
          status: LoanStatus.APPLIED,
          changedBy: borrower1._id,
          changedByName: borrower1.name,
          changedByRole: UserRole.BORROWER,
          timestamp: new Date(Date.now() - 3600000 * 72),
          remarks: 'Application submitted.',
        },
        {
          status: LoanStatus.SANCTIONED,
          changedBy: sanctionExec._id,
          changedByName: sanctionExec.name,
          changedByRole: UserRole.SANCTION,
          timestamp: new Date(Date.now() - 3600000 * 48),
          remarks: 'Sanction approved.',
        },
        {
          status: LoanStatus.DISBURSED,
          changedBy: disbursementExec._id,
          changedByName: disbursementExec.name,
          changedByRole: UserRole.DISBURSEMENT,
          timestamp: new Date(Date.now() - 3600000 * 24),
          remarks: 'Loan disbursed to borrower bank account.',
        },
      ],
      repaymentDetails: {
        totalRepayment: initialTotalRepayment,
        totalPaid: partialPayment1,
        outstandingBalance: remainingOutstanding,
        lastPaymentDate: new Date(Date.now() - 3600000 * 6),
      },
    });

    // Record the first payment for loanDisbursed
    await Payment.create({
      paymentId: 'PMT-20261009-0001',
      loanId: loanDisbursed._id,
      borrowerId: borrower1._id,
      utrNumber: 'HDFCR5202610090001',
      amount: partialPayment1,
      paymentDate: new Date(Date.now() - 3600000 * 6),
      paymentMode: 'IMPS',
      recordedBy: collectionExec._id,
      recordedByName: collectionExec.name,
      remarks: 'First installment payment received via IMPS.',
    });

    // 4. CLOSED Loan (Fully repaid example)
    const calcClosed = LoanMathService.calculate(50000, 30);
    const loanClosed = await Loan.create({
      loanId: 'LN-20261009-0004',
      borrowerId: borrower1._id,
      applicantDetails: {
        fullName: borrower1.name,
        email: borrower1.email,
        pan: borrower1.pan || 'ABCDE1234F',
        dateOfBirth: borrower1.dateOfBirth || new Date('1994-05-15'),
        age: 32,
        monthlySalary: 65000,
        employmentMode: EmploymentMode.SALARIED,
      },
      loanConfig: {
        amount: calcClosed.principal,
        tenureDays: calcClosed.tenureDays,
        interestRate: calcClosed.annualInterestRate,
        interestAmount: calcClosed.interestAmount,
        totalRepayment: calcClosed.totalRepayment,
      },
      breResult: {
        passed: true,
        age: 32,
        checks: {},
        rejectionReasons: [],
        evaluatedAt: new Date(Date.now() - 3600000 * 200),
      },
      status: LoanStatus.CLOSED,
      sanctionDetails: {
        sanctionedBy: sanctionExec._id,
        sanctionedByName: sanctionExec.name,
        sanctionedAt: new Date(Date.now() - 3600000 * 180),
        approvedAmount: 50000,
      },
      disbursementDetails: {
        disbursedBy: disbursementExec._id,
        disbursedByName: disbursementExec.name,
        disbursedAt: new Date(Date.now() - 3600000 * 150),
        disbursementReference: 'DISB-ICICI-445566',
        disbursedAmount: 50000,
      },
      statusHistory: [
        {
          status: LoanStatus.APPLIED,
          changedBy: borrower1._id,
          changedByName: borrower1.name,
          changedByRole: UserRole.BORROWER,
          timestamp: new Date(Date.now() - 3600000 * 200),
        },
        {
          status: LoanStatus.SANCTIONED,
          changedBy: sanctionExec._id,
          changedByName: sanctionExec.name,
          changedByRole: UserRole.SANCTION,
          timestamp: new Date(Date.now() - 3600000 * 180),
        },
        {
          status: LoanStatus.DISBURSED,
          changedBy: disbursementExec._id,
          changedByName: disbursementExec.name,
          changedByRole: UserRole.DISBURSEMENT,
          timestamp: new Date(Date.now() - 3600000 * 150),
        },
        {
          status: LoanStatus.CLOSED,
          changedBy: collectionExec._id,
          changedByName: collectionExec.name,
          changedByRole: UserRole.COLLECTION,
          timestamp: new Date(Date.now() - 3600000 * 20),
          remarks: 'AUTO-CLOSED: Full repayment received. Outstanding balance cleared to ₹0.',
        },
      ],
      repaymentDetails: {
        totalRepayment: calcClosed.totalRepayment,
        totalPaid: calcClosed.totalRepayment,
        outstandingBalance: 0,
        lastPaymentDate: new Date(Date.now() - 3600000 * 20),
      },
    });

    await Payment.create({
      paymentId: 'PMT-20261009-0002',
      loanId: loanClosed._id,
      borrowerId: borrower1._id,
      utrNumber: 'ICICIR9202610099999',
      amount: calcClosed.totalRepayment,
      paymentDate: new Date(Date.now() - 3600000 * 20),
      paymentMode: 'NEFT',
      recordedBy: collectionExec._id,
      recordedByName: collectionExec.name,
      remarks: 'Full settlement payment received via NEFT.',
    });

    console.log('---------------------------------------------------------');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('---------------------------------------------------------');
    console.log('TEST CREDENTIALS FOR EVALUATION:');
    console.log('Password for all accounts: ' + SEED_PASSWORD);
    console.log('1. Admin:        admin@lms.com        (Accesses ALL 4 modules + system views)');
    console.log('2. Sales:        sales@lms.com        (Accesses Sales Leads module)');
    console.log('3. Sanction:     sanction@lms.com     (Accesses Sanction queue: loan LN-20261009-0001)');
    console.log('4. Disbursement: disbursement@lms.com (Accesses Disbursement queue: loan LN-20261009-0002)');
    console.log('5. Collection:   collection@lms.com   (Accesses Collection module: loan LN-20261009-0003)');
    console.log('6. Borrower:     borrower@lms.com     (Rahul Sharma - has active disbursed loan)');
    console.log('7. New Borrower: priya@example.com    (Priya Patel - registered lead on Step 1)');
    console.log('---------------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
};

// Execute if run directly
seedDatabase();
