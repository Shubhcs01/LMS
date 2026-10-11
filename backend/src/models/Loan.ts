import mongoose, { Document, Schema } from 'mongoose';
import { LoanStatus } from '../constants/index.js';

export interface ISalarySlip {
  filename: string;
  originalName: string;
  path: string;
  mimetype: string;
  size: number;
  uploadedAt: Date;
}

export interface IApplicantDetails {
  fullName: string;
  email: string;
  pan: string;
  dateOfBirth: Date;
  age: number;
  monthlySalary: number;
  employmentMode: string;
}

export interface ILoanConfig {
  amount: number;
  tenureDays: number;
  interestRate: number;
  interestAmount: number;
  totalRepayment: number;
}

export interface IStatusHistoryEntry {
  status: LoanStatus;
  changedBy: mongoose.Types.ObjectId;
  changedByName: string;
  changedByRole: string;
  timestamp: Date;
  remarks?: string;
}

export interface ISanctionDetails {
  sanctionedBy?: mongoose.Types.ObjectId;
  sanctionedByName?: string;
  sanctionedAt?: Date;
  approvedAmount?: number;
  remarks?: string;
  rejectionReason?: string;
}

export interface IDisbursementDetails {
  disbursedBy?: mongoose.Types.ObjectId;
  disbursedByName?: string;
  disbursedAt?: Date;
  disbursementReference?: string;
  disbursedAmount?: number;
  bankAccountNumber?: string;
  bankIfsc?: string;
}

export interface IRepaymentDetails {
  totalRepayment: number;
  totalPaid: number;
  outstandingBalance: number;
  lastPaymentDate?: Date;
}

export interface ILoan extends Document {
  loanId: string;
  borrowerId: mongoose.Types.ObjectId;
  applicantDetails: IApplicantDetails;
  salarySlip?: ISalarySlip;
  loanConfig: ILoanConfig;
  breResult: {
    passed: boolean;
    age: number;
    checks: Record<string, any>;
    rejectionReasons: string[];
    evaluatedAt: Date;
  };
  status: LoanStatus;
  statusHistory: IStatusHistoryEntry[];
  sanctionDetails?: ISanctionDetails;
  disbursementDetails?: IDisbursementDetails;
  repaymentDetails: IRepaymentDetails;
  createdAt: Date;
  updatedAt: Date;
}

const loanSchema = new Schema<ILoan>(
  {
    loanId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    borrowerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    applicantDetails: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      pan: { type: String, required: true },
      dateOfBirth: { type: Date, required: true },
      age: { type: Number, required: true },
      monthlySalary: { type: Number, required: true },
      employmentMode: { type: String, required: true },
    },
    salarySlip: {
      filename: String,
      originalName: String,
      path: String,
      mimetype: String,
      size: Number,
      uploadedAt: Date,
    },
    loanConfig: {
      amount: { type: Number, required: true },
      tenureDays: { type: Number, required: true },
      interestRate: { type: Number, required: true, default: 12 },
      interestAmount: { type: Number, required: true },
      totalRepayment: { type: Number, required: true },
    },
    breResult: {
      passed: { type: Boolean, required: true },
      age: { type: Number, required: true },
      checks: { type: Schema.Types.Mixed },
      rejectionReasons: [{ type: String }],
      evaluatedAt: { type: Date, default: Date.now },
    },
    status: {
      type: String,
      enum: Object.values(LoanStatus),
      default: LoanStatus.APPLIED,
      index: true,
    },
    statusHistory: [
      {
        status: { type: String, enum: Object.values(LoanStatus), required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        changedByName: String,
        changedByRole: String,
        timestamp: { type: Date, default: Date.now },
        remarks: String,
      },
    ],
    sanctionDetails: {
      sanctionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      sanctionedByName: String,
      sanctionedAt: Date,
      approvedAmount: Number,
      remarks: String,
      rejectionReason: String,
    },
    disbursementDetails: {
      disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      disbursedByName: String,
      disbursedAt: Date,
      disbursementReference: String,
      disbursedAmount: Number,
      bankAccountNumber: String,
      bankIfsc: String,
    },
    repaymentDetails: {
      totalRepayment: { type: Number, required: true },
      totalPaid: { type: Number, default: 0 },
      outstandingBalance: { type: Number, required: true },
      lastPaymentDate: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Loan = mongoose.model<ILoan>('Loan', loanSchema);
