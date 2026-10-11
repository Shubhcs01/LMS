export enum UserRole {
  ADMIN = 'Admin',
  SALES = 'Sales',
  SANCTION = 'Sanction',
  DISBURSEMENT = 'Disbursement',
  COLLECTION = 'Collection',
  BORROWER = 'Borrower',
}

export enum LoanStatus {
  APPLIED = 'APPLIED',
  SANCTIONED = 'SANCTIONED',
  DISBURSED = 'DISBURSED',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
}

export enum EmploymentMode {
  SALARIED = 'Salaried',
  SELF_EMPLOYED = 'Self-Employed',
  UNEMPLOYED = 'Unemployed',
}

export const BRE_CONFIG = {
  MIN_AGE: 23,
  MAX_AGE: 50,
  MIN_SALARY: 25000,
  PAN_REGEX: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  DISALLOWED_EMPLOYMENT: EmploymentMode.UNEMPLOYED,
} as const;

export const LOAN_CONFIG = {
  MIN_AMOUNT: 50000,
  MAX_AMOUNT: 500000,
  MIN_TENURE_DAYS: 30,
  MAX_TENURE_DAYS: 365,
  ANNUAL_INTEREST_RATE_PERCENT: 12, // 12% p.a.
} as const;
