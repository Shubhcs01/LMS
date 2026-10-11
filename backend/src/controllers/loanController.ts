import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { Loan, ILoan } from '../models/Loan.js';
import { AuditLog } from '../models/AuditLog.js';
import { LoanStatus, UserRole } from '../constants/index.js';

// Get list of all loans (Admin or filtered by status)
export const getAllLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search, page = '1', limit = '50' } = req.query;

    const query: any = {};
    if (status && Object.values(LoanStatus).includes(status as LoanStatus)) {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [
        { loanId: searchRegex },
        { 'applicantDetails.fullName': searchRegex },
        { 'applicantDetails.pan': searchRegex },
        { 'applicantDetails.email': searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const loans = await Loan.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Loan.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      loans,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loans.',
      error: error.message,
    });
  }
};

// Sanction module queue: APPLIED loans
export const getSanctionQueue = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: LoanStatus.APPLIED }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: loans.length,
      loans,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sanction queue.',
      error: error.message,
    });
  }
};

// Review sanction: Approve or Reject
export const reviewSanction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { decision, remarks, rejectionReason, approvedAmount } = req.body;

    if (!decision || !['APPROVE', 'REJECT'].includes(decision)) {
      res.status(400).json({
        success: false,
        message: 'Decision is required and must be either APPROVE or REJECT.',
      });
      return;
    }

    if (decision === 'REJECT' && !rejectionReason) {
      res.status(400).json({
        success: false,
        message: 'Rejection reason is mandatory when rejecting a loan.',
      });
      return;
    }

    const loan = await Loan.findById(id);
    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan application not found.' });
      return;
    }

    if (loan.status !== LoanStatus.APPLIED) {
      res.status(400).json({
        success: false,
        message: `Invalid transition: Only loans in APPLIED status can be reviewed. Current status: ${loan.status}`,
      });
      return;
    }

    if (decision === 'APPROVE') {
      loan.status = LoanStatus.SANCTIONED;
      loan.sanctionDetails = {
        sanctionedBy: user._id,
        sanctionedByName: user.name,
        sanctionedAt: new Date(),
        approvedAmount: approvedAmount || loan.loanConfig.amount,
        remarks: remarks || 'Sanction approved by executive.',
      };
      loan.statusHistory.push({
        status: LoanStatus.SANCTIONED,
        changedBy: user._id,
        changedByName: user.name,
        changedByRole: user.role,
        timestamp: new Date(),
        remarks: remarks || `Loan sanctioned for ₹${loan.sanctionDetails.approvedAmount}`,
      });
    } else {
      loan.status = LoanStatus.REJECTED;
      loan.sanctionDetails = {
        sanctionedBy: user._id,
        sanctionedByName: user.name,
        sanctionedAt: new Date(),
        rejectionReason,
        remarks: remarks || 'Application rejected by sanction executive.',
      };
      loan.statusHistory.push({
        status: LoanStatus.REJECTED,
        changedBy: user._id,
        changedByName: user.name,
        changedByRole: user.role,
        timestamp: new Date(),
        remarks: `Rejected: ${rejectionReason}. Additional notes: ${remarks || 'None'}`,
      });
    }

    await loan.save();

    await AuditLog.create({
      action: decision === 'APPROVE' ? 'LOAN_SANCTIONED' : 'LOAN_SANCTION_REJECTED',
      performedBy: user._id,
      performedByName: user.name,
      performedByRole: user.role,
      targetId: loan._id.toString(),
      details: {
        loanId: loan.loanId,
        decision,
        remarks,
        rejectionReason,
      },
    });

    res.status(200).json({
      success: true,
      message:
        decision === 'APPROVE'
          ? `Loan ${loan.loanId} successfully SANCTIONED.`
          : `Loan ${loan.loanId} REJECTED.`,
      loan,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update sanction review.',
      error: error.message,
    });
  }
};

// Disbursement module queue: SANCTIONED loans
export const getDisbursementQueue = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: LoanStatus.SANCTIONED }).sort({ updatedAt: -1 });
    res.status(200).json({
      success: true,
      count: loans.length,
      loans,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch disbursement queue.',
      error: error.message,
    });
  }
};

// Mark loan as disbursed: SANCTIONED -> DISBURSED
export const recordDisbursement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { disbursementReference, bankAccountNumber, bankIfsc, remarks } = req.body;

    if (!disbursementReference) {
      res.status(400).json({
        success: false,
        message: 'Disbursement reference / transaction ID is required.',
      });
      return;
    }

    const loan = await Loan.findById(id);
    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found.' });
      return;
    }

    if (loan.status !== LoanStatus.SANCTIONED) {
      res.status(400).json({
        success: false,
        message: `Invalid transition: Only loans in SANCTIONED status can be disbursed. Current status: ${loan.status}`,
      });
      return;
    }

    loan.status = LoanStatus.DISBURSED;
    loan.disbursementDetails = {
      disbursedBy: user._id,
      disbursedByName: user.name,
      disbursedAt: new Date(),
      disbursementReference: disbursementReference.trim(),
      disbursedAmount: loan.loanConfig.amount,
      bankAccountNumber: bankAccountNumber || 'A/C-DEFAULT-001',
      bankIfsc: bankIfsc || 'SBIN0001234',
    };

    // Ensure repayment structure is intact
    loan.repaymentDetails = {
      totalRepayment: loan.loanConfig.totalRepayment,
      totalPaid: 0,
      outstandingBalance: loan.loanConfig.totalRepayment,
    };

    loan.statusHistory.push({
      status: LoanStatus.DISBURSED,
      changedBy: user._id,
      changedByName: user.name,
      changedByRole: user.role,
      timestamp: new Date(),
      remarks: remarks || `Funds released via Ref: ${disbursementReference.trim()}`,
    });

    await loan.save();

    await AuditLog.create({
      action: 'LOAN_DISBURSED',
      performedBy: user._id,
      performedByName: user.name,
      performedByRole: user.role,
      targetId: loan._id.toString(),
      details: {
        loanId: loan.loanId,
        disbursementReference,
        disbursedAmount: loan.loanConfig.amount,
      },
    });

    res.status(200).json({
      success: true,
      message: `Loan ${loan.loanId} successfully marked as DISBURSED. Funds released.`,
      loan,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to record disbursement.',
      error: error.message,
    });
  }
};

// Collection module queue: Active disbursed loans and closed loans
export const getCollectionQueue = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({
      status: { $in: [LoanStatus.DISBURSED, LoanStatus.CLOSED] },
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: loans.length,
      loans,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collection queue.',
      error: error.message,
    });
  }
};

// Get single loan detail with complete status history and repayment state
export const getLoanDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const loan = await Loan.findById(id).populate('borrowerId', 'name email phone');

    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      loan,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loan details.',
      error: error.message,
    });
  }
};

// Executive statistics for Dashboard Overview
export const getDashboardStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalApplied = await Loan.countDocuments({ status: LoanStatus.APPLIED });
    const totalSanctioned = await Loan.countDocuments({ status: LoanStatus.SANCTIONED });
    const totalDisbursed = await Loan.countDocuments({ status: LoanStatus.DISBURSED });
    const totalClosed = await Loan.countDocuments({ status: LoanStatus.CLOSED });
    const totalRejected = await Loan.countDocuments({ status: LoanStatus.REJECTED });

    // Financial aggregates
    const financialStats = await Loan.aggregate([
      {
        $group: {
          _id: null,
          totalPrincipalDisbursed: {
            $sum: {
              $cond: [
                { $in: ['$status', [LoanStatus.DISBURSED, LoanStatus.CLOSED]] },
                '$loanConfig.amount',
                0,
              ],
            },
          },
          totalCollected: {
            $sum: '$repaymentDetails.totalPaid',
          },
          totalOutstanding: {
            $sum: {
              $cond: [{ $eq: ['$status', LoanStatus.DISBURSED] }, '$repaymentDetails.outstandingBalance', 0],
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      counts: {
        applied: totalApplied,
        sanctioned: totalSanctioned,
        disbursed: totalDisbursed,
        closed: totalClosed,
        rejected: totalRejected,
        totalLoans: totalApplied + totalSanctioned + totalDisbursed + totalClosed + totalRejected,
      },
      financials: financialStats[0] || {
        totalPrincipalDisbursed: 0,
        totalCollected: 0,
        totalOutstanding: 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics.',
      error: error.message,
    });
  }
};
