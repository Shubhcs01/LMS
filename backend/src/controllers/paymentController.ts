import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { Loan } from '../models/Loan.js';
import { Payment } from '../models/Payment.js';
import { AuditLog } from '../models/AuditLog.js';
import { LoanStatus } from '../constants/index.js';

export const recordPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { loanId, utrNumber, amount, paymentDate, paymentMode, remarks } = req.body;

    // 1. Mandatory input validation
    if (!loanId || !utrNumber || !amount) {
      res.status(400).json({
        success: false,
        message: 'Loan ID, UTR Number, and Payment Amount are mandatory.',
      });
      return;
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Payment amount must be a positive number greater than 0.',
      });
      return;
    }

    const normalizedUtr = String(utrNumber).trim().toUpperCase();

    // 2. Validate UTR uniqueness across all payments
    const existingPaymentWithUtr = await Payment.findOne({ utrNumber: normalizedUtr });
    if (existingPaymentWithUtr) {
      res.status(409).json({
        success: false,
        message: `Duplicate UTR detected: Transaction with UTR "${normalizedUtr}" has already been recorded previously in the system.`,
        utrNumber: normalizedUtr,
      });
      return;
    }

    // 3. Find and validate Loan
    const loan = await Loan.findById(loanId);
    if (!loan) {
      res.status(404).json({
        success: false,
        message: 'Loan record not found.',
      });
      return;
    }

    if (loan.status === LoanStatus.CLOSED) {
      res.status(400).json({
        success: false,
        message: `Loan ${loan.loanId} is already fully paid and CLOSED. No further payments can be accepted.`,
      });
      return;
    }

    if (loan.status !== LoanStatus.DISBURSED) {
      res.status(400).json({
        success: false,
        message: `Payments can only be collected for active DISBURSED loans. Current loan status is ${loan.status}.`,
      });
      return;
    }

    // 4. Validate Amount against Outstanding Balance
    const currentOutstanding = loan.repaymentDetails.outstandingBalance;
    if (numericAmount > currentOutstanding) {
      res.status(400).json({
        success: false,
        message: `Payment amount of ₹${numericAmount.toLocaleString('en-IN')} exceeds the remaining outstanding balance of ₹${currentOutstanding.toLocaleString('en-IN')}.`,
        outstandingBalance: currentOutstanding,
        amountEntered: numericAmount,
      });
      return;
    }

    // 5. Generate Payment Record
    const count = await Payment.countDocuments();
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const paymentId = `PMT-${todayStr}-${String(count + 1).padStart(4, '0')}`;

    const newPayment = await Payment.create({
      paymentId,
      loanId: loan._id,
      borrowerId: loan.borrowerId,
      utrNumber: normalizedUtr,
      amount: numericAmount,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMode: paymentMode || 'IMPS',
      recordedBy: user._id,
      recordedByName: user.name,
      remarks: remarks || `Repayment recorded by Collection Executive (${user.name})`,
    });

    // 6. Update Loan Repayment Details and Auto-Close if fully repaid
    const newTotalPaid = Math.round(((loan.repaymentDetails.totalPaid || 0) + numericAmount) * 100) / 100;
    const newOutstanding = Math.max(0, Math.round((loan.repaymentDetails.totalRepayment - newTotalPaid) * 100) / 100);

    loan.repaymentDetails.totalPaid = newTotalPaid;
    loan.repaymentDetails.outstandingBalance = newOutstanding;
    loan.repaymentDetails.lastPaymentDate = newPayment.paymentDate;

    let autoClosed = false;
    if (newOutstanding === 0 || newTotalPaid >= loan.repaymentDetails.totalRepayment) {
      loan.status = LoanStatus.CLOSED;
      autoClosed = true;

      loan.statusHistory.push({
        status: LoanStatus.CLOSED,
        changedBy: user._id,
        changedByName: user.name,
        changedByRole: user.role,
        timestamp: new Date(),
        remarks: `AUTO-CLOSED: Loan fully repaid. Total paid: ₹${newTotalPaid.toLocaleString('en-IN')}, Outstanding balance cleared to ₹0.`,
      });
    }

    await loan.save();

    await AuditLog.create({
      action: autoClosed ? 'PAYMENT_RECORDED_AND_LOAN_CLOSED' : 'PAYMENT_RECORDED',
      performedBy: user._id,
      performedByName: user.name,
      performedByRole: user.role,
      targetId: loan._id.toString(),
      details: {
        paymentId,
        utrNumber: normalizedUtr,
        amount: numericAmount,
        newOutstandingBalance: newOutstanding,
        loanClosed: autoClosed,
      },
    });

    res.status(201).json({
      success: true,
      message: autoClosed
        ? `Payment of ₹${numericAmount.toLocaleString('en-IN')} recorded successfully. Loan ${loan.loanId} has been AUTO-CLOSED!`
        : `Payment of ₹${numericAmount.toLocaleString('en-IN')} recorded successfully. Remaining outstanding balance: ₹${newOutstanding.toLocaleString('en-IN')}.`,
      payment: newPayment,
      loan: {
        id: loan._id,
        loanId: loan.loanId,
        status: loan.status,
        repaymentDetails: loan.repaymentDetails,
        autoClosed,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to record payment.',
      error: error.message,
    });
  }
};

export const getLoanPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { loanId } = req.params;
    const payments = await Payment.find({ loanId }).sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments.',
      error: error.message,
    });
  }
};
