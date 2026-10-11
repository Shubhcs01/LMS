import { LOAN_CONFIG } from '../constants/index.js';

export interface LoanCalculationResult {
  principal: number;
  tenureDays: number;
  annualInterestRate: number; // e.g. 12
  interestAmount: number;     // SI = (P * R * T) / (365 * 100)
  totalRepayment: number;     // P + SI
  dailyInterest: number;
}

export class LoanMathService {
  /**
   * Calculates Simple Interest and Total Repayment according to lending guidelines:
   * SI = (P * R * T) / (365 * 100)
   * Total Repayment = P + SI
   */
  public static calculate(
    principal: number,
    tenureDays: number,
    annualInterestRate: number = LOAN_CONFIG.ANNUAL_INTEREST_RATE_PERCENT
  ): LoanCalculationResult {
    // Validate bounds
    if (principal < LOAN_CONFIG.MIN_AMOUNT || principal > LOAN_CONFIG.MAX_AMOUNT) {
      throw new Error(
        `Loan amount must be between ₹${LOAN_CONFIG.MIN_AMOUNT.toLocaleString('en-IN')} and ₹${LOAN_CONFIG.MAX_AMOUNT.toLocaleString('en-IN')}`
      );
    }

    if (tenureDays < LOAN_CONFIG.MIN_TENURE_DAYS || tenureDays > LOAN_CONFIG.MAX_TENURE_DAYS) {
      throw new Error(
        `Loan tenure must be between ${LOAN_CONFIG.MIN_TENURE_DAYS} and ${LOAN_CONFIG.MAX_TENURE_DAYS} days`
      );
    }

    // SI = (P * R * T) / (365 * 100)
    const rawInterest = (principal * annualInterestRate * tenureDays) / (365 * 100);
    // Round to 2 decimal places or nearest rupee
    const interestAmount = Math.round(rawInterest * 100) / 100;
    const totalRepayment = Math.round((principal + interestAmount) * 100) / 100;
    const dailyInterest = Math.round((rawInterest / tenureDays) * 100) / 100;

    return {
      principal,
      tenureDays,
      annualInterestRate,
      interestAmount,
      totalRepayment,
      dailyInterest,
    };
  }
}
