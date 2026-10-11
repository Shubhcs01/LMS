'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Loan, LoanStatus, UserRole } from '../../types';
import { RoleGuard } from '../../components/RoleGuard';
import { StatusBadge } from '../../components/StatusBadge';
import {
  FileText,
  Clock,
  CheckCircle2,
  Send,
  CheckCheck,
  XCircle,
  PlusCircle,
  IndianRupee,
  Calendar,
  AlertCircle,
  Receipt,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function BorrowerDashboardPage() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const res = await api.getMyLoans();
        setLoans(res.loans || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch loans.');
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, []);

  const getStatusStepIndex = (status: LoanStatus) => {
    switch (status) {
      case LoanStatus.APPLIED:
        return 1;
      case LoanStatus.SANCTIONED:
        return 2;
      case LoanStatus.DISBURSED:
        return 3;
      case LoanStatus.CLOSED:
        return 4;
      case LoanStatus.REJECTED:
        return -1;
      default:
        return 1;
    }
  };

  return (
    <RoleGuard allowedRoles={[UserRole.BORROWER]}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Borrower Portal</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold font-mono">
                {user?.role}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Welcome back, <strong className="text-slate-200">{user?.name}</strong>. Track your loan application status, sanction approvals, and repayment schedule.
            </p>
          </div>

          <Link
            href="/borrower/apply"
            className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/20 inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Apply for New Loan</span>
          </Link>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading your loan records...</p>
          </div>
        ) : loans.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Loan Applications Found</h3>
            <p className="text-xs text-slate-400">
              You haven&apos;t applied for any loans yet. Click the button below to start your 4-step application with instant BRE underwriting!
            </p>
            <Link
              href="/borrower/apply"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/20"
            >
              <PlusCircle className="w-4 h-4" /> Apply for Loan
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Your Loan Applications ({loans.length})</span>
            </h2>

            <div className="space-y-6">
              {loans.map((loan) => {
                const stepIdx = getStatusStepIndex(loan.status);

                return (
                  <div
                    key={loan._id}
                    className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-lg space-y-6"
                  >
                    {/* Top Row: Loan ID + Status + Applied Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          <IndianRupee className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-mono font-bold text-white text-base">
                            {loan.loanId}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Applied on {new Date(loan.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <StatusBadge status={loan.status} size="lg" />
                      </div>
                    </div>

                    {/* Visual Status Progress Tracker */}
                    {loan.status !== LoanStatus.REJECTED ? (
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                          Lifecycle Progress Tracker
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center relative">
                          {/* Step 1: APPLIED */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition ${
                                stepIdx >= 1
                                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              <Clock className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-300">APPLIED</span>
                            <span className="text-[10px] text-slate-500">Under Review</span>
                          </div>

                          {/* Step 2: SANCTIONED */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition ${
                                stepIdx >= 2
                                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-300">SANCTIONED</span>
                            <span className="text-[10px] text-slate-500">Approved</span>
                          </div>

                          {/* Step 3: DISBURSED */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition ${
                                stepIdx >= 3
                                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              <Send className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-300">DISBURSED</span>
                            <span className="text-[10px] text-slate-500">Funds Released</span>
                          </div>

                          {/* Step 4: CLOSED */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition ${
                                stepIdx >= 4
                                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              <CheckCheck className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-300">CLOSED</span>
                            <span className="text-[10px] text-slate-500">Fully Repaid</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-rose-400">Application Rejected</div>
                          <div className="text-xs mt-0.5">
                            Reason:{' '}
                            <strong className="text-white">
                              {loan.sanctionDetails?.rejectionReason || 'Underwriting criteria not satisfied'}
                            </strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Financial Metrics Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                          Principal Amount
                        </div>
                        <div className="text-base font-bold font-mono text-white">
                          ₹{loan.loanConfig.amount?.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                          Tenure & Rate
                        </div>
                        <div className="text-base font-bold font-mono text-indigo-400">
                          {loan.loanConfig.tenureDays}d @ {loan.loanConfig.interestRate}%
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                          Total Repayment (P+SI)
                        </div>
                        <div className="text-base font-bold font-mono text-amber-400">
                          ₹{loan.repaymentDetails?.totalRepayment?.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                          Outstanding Balance
                        </div>
                        <div className="text-base font-bold font-mono text-emerald-400">
                          ₹{loan.repaymentDetails?.outstandingBalance?.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* Disbursement Details if disbursed */}
                    {loan.disbursementDetails && (
                      <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs flex flex-wrap items-center justify-between gap-2 text-emerald-300">
                        <div className="flex items-center gap-2">
                          <Send className="w-4 h-4 text-emerald-400" />
                          <span>
                            Disbursed Reference:{' '}
                            <strong className="font-mono text-white">
                              {loan.disbursementDetails.disbursementReference}
                            </strong>
                          </span>
                        </div>
                        <span className="text-[11px] text-emerald-400">
                          Disbursed on{' '}
                          {new Date(loan.disbursementDetails.disbursedAt || '').toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
