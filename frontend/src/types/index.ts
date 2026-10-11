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

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  pan?: string;
  dateOfBirth?: string;
  monthlySalary?: number;
  employmentMode?: EmploymentMode;
  applicationStepCompleted?: number;
}

export interface BRERuleCheck {
  ruleName: string;
  passed: boolean;
  message: string;
  value?: any;
}

export interface BREResult {
  passed: boolean;
  age: number;
  checks: {
    ageCheck: BRERuleCheck;
    salaryCheck: BRERuleCheck;
    panCheck: BRERuleCheck;
    employmentCheck: BRERuleCheck;
  };
  rejectionReasons: string[];
}

export interface LoanConfig {
  amount: number;
  tenureDays: number;
  interestRate: number;
  interestAmount: number;
  totalRepayment: number;
  dailyInterest?: number;
}

export interface SalarySlip {
  filename: string;
  originalName: string;
  path: string;
  mimetype: string;
  size: number;
  uploadedAt: string;
}

export interface ApplicantDetails {
  fullName: string;
  email: string;
  pan: string;
  dateOfBirth: string;
  age: number;
  monthlySalary: number;
  employmentMode: string;
}

export interface StatusHistoryEntry {
  status: LoanStatus;
  changedBy?: string;
  changedByName?: string;
  changedByRole?: string;
  timestamp: string;
  remarks?: string;
}

export interface SanctionDetails {
  sanctionedBy?: string;
  sanctionedByName?: string;
  sanctionedAt?: string;
  approvedAmount?: number;
  remarks?: string;
  rejectionReason?: string;
}

export interface DisbursementDetails {
  disbursedBy?: string;
  disbursedByName?: string;
  disbursedAt?: string;
  disbursementReference?: string;
  disbursedAmount?: number;
  bankAccountNumber?: string;
  bankIfsc?: string;
}

export interface RepaymentDetails {
  totalRepayment: number;
  totalPaid: number;
  outstandingBalance: number;
  lastPaymentDate?: string;
}

export interface Loan {
  _id: string;
  loanId: string;
  borrowerId: string | { _id: string; name: string; email: string; phone?: string };
  applicantDetails: ApplicantDetails;
  salarySlip?: SalarySlip;
  loanConfig: LoanConfig;
  breResult: {
    passed: boolean;
    age: number;
    checks: Record<string, BRERuleCheck>;
    rejectionReasons: string[];
    evaluatedAt: string;
  };
  status: LoanStatus;
  statusHistory: StatusHistoryEntry[];
  sanctionDetails?: SanctionDetails;
  disbursementDetails?: DisbursementDetails;
  repaymentDetails: RepaymentDetails;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  paymentId: string;
  loanId: string;
  borrowerId: string;
  utrNumber: string;
  amount: number;
  paymentDate: string;
  paymentMode: string;
  recordedBy: string;
  recordedByName: string;
  remarks?: string;
  createdAt: string;
}

export interface LeadNote {
  note: string;
  addedBy: string;
  addedByName: string;
  addedAt: string;
}

export interface Lead {
  _id: string;
  borrowerId: string;
  name: string;
  email: string;
  phone?: string;
  currentStep: number;
  leadStatus: string;
  assignedTo?: string;
  assignedToName?: string;
  notes: LeadNote[];
  lastContactedAt?: string;
  hasApplied: boolean;
  createdAt: string;
  updatedAt: string;
}
