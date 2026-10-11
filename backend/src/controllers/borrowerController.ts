import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { User } from '../models/User.js';
import { Loan, ILoan } from '../models/Loan.js';
import { Lead, LeadStatus } from '../models/Lead.js';
import { AuditLog } from '../models/AuditLog.js';
import { BREService, calculateAge } from '../services/breService.js';
import { LoanMathService } from '../services/loanMathService.js';
import { LoanStatus, UserRole } from '../constants/index.js';
import path from 'path';

export const checkBREAndSaveDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { fullName, pan, dateOfBirth, monthlySalary, employmentMode } = req.body;

    if (!fullName || !pan || !dateOfBirth || monthlySalary === undefined || !employmentMode) {
      res.status(400).json({
        success: false,
        message: 'Please provide all required fields: fullName, pan, dateOfBirth, monthlySalary, employmentMode.',
      });
      return;
    }

    const parsedSalary = Number(monthlySalary);
    const normalizedPan = String(pan).trim().toUpperCase();

    // Run Server-Side Business Rule Engine (BRE)
    const breResult = BREService.evaluate({
      fullName,
      pan: normalizedPan,
      dateOfBirth,
      monthlySalary: parsedSalary,
      employmentMode,
    });

    // Update User record with details
    user.name = fullName;
    user.pan = normalizedPan;
    user.dateOfBirth = new Date(dateOfBirth);
    user.monthlySalary = parsedSalary;
    user.employmentMode = employmentMode as any;

    if (!breResult.passed) {
      // Rejection: do not advance application step; log audit; update lead
      await user.save();

      await Lead.findOneAndUpdate(
        { borrowerId: user._id },
        {
          currentStep: 2,
          leadStatus: LeadStatus.DROPPED,
          $push: {
            notes: {
              note: `BRE Rejected: ${breResult.rejectionReasons.join('; ')}`,
              addedBy: user._id,
              addedByName: 'BRE Engine',
              addedAt: new Date(),
            },
          },
        }
      );

      await AuditLog.create({
        action: 'BRE_EVALUATION_FAILED',
        performedBy: user._id,
        performedByName: user.name,
        performedByRole: user.role,
        targetId: user._id.toString(),
        details: { breResult, rejectionReasons: breResult.rejectionReasons },
      });

      res.status(422).json({
        success: false,
        message: 'Business Rule Engine eligibility check failed. Applicant does not satisfy lending criteria.',
        breResult,
      });
      return;
    }

    // BRE Passed! Advance step to 2
    user.applicationStepCompleted = Math.max(user.applicationStepCompleted || 1, 2);
    await user.save();

    await Lead.findOneAndUpdate(
      { borrowerId: user._id },
      {
        currentStep: 2,
        leadStatus: LeadStatus.DOCUMENT_PENDING,
        $push: {
          notes: {
            note: 'BRE Check passed successfully. Awaiting salary slip upload.',
            addedBy: user._id,
            addedByName: 'BRE Engine',
            addedAt: new Date(),
          },
        },
      }
    );

    await AuditLog.create({
      action: 'BRE_EVALUATION_PASSED',
      performedBy: user._id,
      performedByName: user.name,
      performedByRole: user.role,
      targetId: user._id.toString(),
      details: { breResult },
    });

    res.status(200).json({
      success: true,
      message: 'Business Rule Engine checks passed successfully!',
      breResult,
      user: {
        id: user._id,
        name: user.name,
        pan: user.pan,
        dateOfBirth: user.dateOfBirth,
        monthlySalary: user.monthlySalary,
        employmentMode: user.employmentMode,
        applicationStepCompleted: user.applicationStepCompleted,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error processing personal details and BRE evaluation.',
      error: error.message,
    });
  }
};

export const uploadSalarySlipController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a valid salary slip (PDF, JPG, or PNG up to 5MB).',
      });
      return;
    }

    user.applicationStepCompleted = Math.max(user.applicationStepCompleted || 1, 3);
    await user.save();

    await Lead.findOneAndUpdate(
      { borrowerId: user._id },
      {
        currentStep: 3,
        leadStatus: LeadStatus.FOLLOW_UP_REQUIRED,
        $push: {
          notes: {
            note: `Salary slip uploaded: ${file.originalname}`,
            addedBy: user._id,
            addedByName: user.name,
            addedAt: new Date(),
          },
        },
      }
    );

    const filePayload = {
      filename: file.filename,
      originalName: file.originalname,
      path: file.path.replace(/\\/g, '/'),
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
    };

    res.status(200).json({
      success: true,
      message: 'Salary slip uploaded successfully.',
      file: filePayload,
      applicationStepCompleted: user.applicationStepCompleted,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'File upload failed.',
      error: error.message,
    });
  }
};

export const calculateLoanOffer = (req: AuthRequest, res: Response): void => {
  try {
    const amount = Number(req.query.amount);
    const tenureDays = Number(req.query.tenureDays);

    if (isNaN(amount) || isNaN(tenureDays)) {
      res.status(400).json({
        success: false,
        message: 'Please provide valid numeric values for amount and tenureDays query params.',
      });
      return;
    }

    const calculation = LoanMathService.calculate(amount, tenureDays);
    res.status(200).json({
      success: true,
      calculation,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const applyForLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { amount, tenureDays, salarySlip } = req.body;

    if (!amount || !tenureDays) {
      res.status(400).json({
        success: false,
        message: 'Loan amount and tenure (in days) are required.',
      });
      return;
    }

    // Ensure applicant details exist
    if (!user.name || !user.pan || !user.dateOfBirth || !user.monthlySalary || !user.employmentMode) {
      res.status(400).json({
        success: false,
        message: 'Personal details incomplete. Please complete Step 2 before applying.',
      });
      return;
    }

    // Verify BRE again on server before submission
    const breResult = BREService.evaluate({
      fullName: user.name,
      pan: user.pan,
      dateOfBirth: user.dateOfBirth,
      monthlySalary: user.monthlySalary,
      employmentMode: user.employmentMode,
    });

    if (!breResult.passed) {
      res.status(422).json({
        success: false,
        message: 'Cannot apply: Business Rule Engine checks failed.',
        breResult,
      });
      return;
    }

    // Calculate loan finances
    const calc = LoanMathService.calculate(Number(amount), Number(tenureDays));

    // Generate unique loan ID: LN-YYYYMMDD-XXXX
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Loan.countDocuments();
    const loanId = `LN-${todayStr}-${String(count + 1).padStart(4, '0')}`;

    const newLoan = await Loan.create({
      loanId,
      borrowerId: user._id,
      applicantDetails: {
        fullName: user.name,
        email: user.email,
        pan: user.pan,
        dateOfBirth: user.dateOfBirth,
        age: breResult.age,
        monthlySalary: user.monthlySalary,
        employmentMode: user.employmentMode,
      },
      salarySlip: salarySlip || undefined,
      loanConfig: {
        amount: calc.principal,
        tenureDays: calc.tenureDays,
        interestRate: calc.annualInterestRate,
        interestAmount: calc.interestAmount,
        totalRepayment: calc.totalRepayment,
      },
      breResult: {
        passed: true,
        age: breResult.age,
        checks: breResult.checks,
        rejectionReasons: [],
        evaluatedAt: new Date(),
      },
      status: LoanStatus.APPLIED,
      statusHistory: [
        {
          status: LoanStatus.APPLIED,
          changedBy: user._id,
          changedByName: user.name,
          changedByRole: user.role,
          timestamp: new Date(),
          remarks: 'Application submitted by borrower with pending sanction review.',
        },
      ],
      repaymentDetails: {
        totalRepayment: calc.totalRepayment,
        totalPaid: 0,
        outstandingBalance: calc.totalRepayment,
      },
    });

    // Update user step
    user.applicationStepCompleted = 4;
    await user.save();

    // Update Lead to CONVERTED
    await Lead.findOneAndUpdate(
      { borrowerId: user._id },
      {
        currentStep: 4,
        hasApplied: true,
        leadStatus: LeadStatus.CONVERTED,
        $push: {
          notes: {
            note: `Loan application submitted successfully. Loan ID: ${loanId}, Amount: ₹${calc.principal}`,
            addedBy: user._id,
            addedByName: 'System',
            addedAt: new Date(),
          },
        },
      }
    );

    await AuditLog.create({
      action: 'LOAN_APPLIED',
      performedBy: user._id,
      performedByName: user.name,
      performedByRole: user.role,
      targetId: newLoan._id.toString(),
      details: { loanId, amount: calc.principal, tenureDays: calc.tenureDays },
    });

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully! Your application is now in APPLIED status awaiting sanction review.',
      loan: newLoan,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error submitting loan application.',
      error: error.message,
    });
  }
};

export const getMyLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const loans = await Loan.find({ borrowerId: user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: loans.length,
      loans,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve loans.',
      error: error.message,
    });
  }
};

export const getMyLoanById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const loan = await Loan.findOne({ _id: id, borrowerId: user._id });

    if (!loan) {
      res.status(404).json({
        success: false,
        message: 'Loan not found or does not belong to you.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      loan,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve loan details.',
      error: error.message,
    });
  }
};
