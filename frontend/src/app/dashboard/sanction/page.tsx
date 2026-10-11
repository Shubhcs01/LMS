'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { Loan, UserRole, LoanStatus } from '../../../types';
import { RoleGuard } from '../../../components/RoleGuard';
import { StatusBadge } from '../../../components/StatusBadge';
import { SalarySlipPreviewModal } from '../../../components/SalarySlipPreviewModal';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  AlertCircle,
  IndianRupee,
  Calendar,
  CreditCard,
  Briefcase,
  User as UserIcon,
  Check,
  X,
  Clock,
} from 'lucide-react';

export default function SanctionModulePage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLoanForReview, setActiveLoanForReview] = useState<Loan | null>(null);
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [remarks, setRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Salary slip preview modal
  const [previewSalarySlip, setPreviewSalarySlip] = useState<any | null>(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await api.getSanctionQueue();
      setLoans(res.loans || []);
    } catch (e: any) {
      setFeedbackMsg({ type: 'error', text: e.message || 'Failed to fetch sanction queue.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLoanForReview) return;

    if (decision === 'REJECT' && !rejectionReason.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Rejection reason is mandatory when rejecting a loan application.' });
      return;
    }

    setActionLoading(true);
    setFeedbackMsg(null);

    try {
      const res = await api.reviewSanction(activeLoanForReview._id, {
        decision,
        remarks: remarks || undefined,
        rejectionReason: decision === 'REJECT' ? rejectionReason : undefined,
      });

      setFeedbackMsg({
        type: 'success',
        text: `Loan ${activeLoanForReview.loanId} successfully ${
          decision === 'APPROVE' ? 'SANCTIONED' : 'REJECTED'
        }!`,
      });

      setActiveLoanForReview(null);
      setRemarks('');
      setRejectionReason('');
      await fetchQueue();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update sanction review.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={[UserRole.SANCTION]}>
      <div className="space-y-6 animate-fade-in">
        {/* Module Header */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">Sanction & Underwriting Module</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold font-mono">
                  Stage 2: Sanction Review
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Review submitted APPLIED loans, inspect BRE rule pass reports, review salary slip proofs, and approve or reject with a reason.
              </p>
            </div>
          </div>

          <div className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
            Pending Sanction Queue: <strong className="text-amber-400">{loans.length}</strong>
          </div>
        </div>

        {feedbackMsg && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Applied Loans List */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading sanction queue...</p>
          </div>
        ) : loans.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-2">
            <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Loans Pending Sanction Review</h3>
            <p className="text-xs text-slate-400">All submitted loan applications have been underwritten.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => (
              <div
                key={loan._id}
                className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-5 shadow-sm"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-mono font-bold text-white text-base">
                        {loan.loanId}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Applicant: <strong className="text-slate-200">{loan.applicantDetails.fullName}</strong> • Applied on{' '}
                        {new Date(loan.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={loan.status} size="md" />
                    <button
                      onClick={() => {
                        setActiveLoanForReview(loan);
                        setDecision('APPROVE');
                        setRemarks('');
                        setRejectionReason('');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-amber-600/20"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Review Application</span>
                    </button>
                  </div>
                </div>

                {/* Applicant & BRE Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] text-slate-500 mb-0.5">PAN & Age</div>
                    <div className="font-mono font-bold text-white">{loan.applicantDetails.pan}</div>
                    <div className="text-[11px] text-slate-400">{loan.applicantDetails.age} years old</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] text-slate-500 mb-0.5">Declared Salary</div>
                    <div className="font-mono font-bold text-white">
                      ₹{loan.applicantDetails.monthlySalary?.toLocaleString('en-IN')} / mo
                    </div>
                    <div className="text-[11px] text-indigo-400">{loan.applicantDetails.employmentMode}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] text-slate-500 mb-0.5">Requested Loan</div>
                    <div className="font-mono font-bold text-white">
                      ₹{loan.loanConfig.amount?.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-amber-400">
                      {loan.loanConfig.tenureDays} days @ {loan.loanConfig.interestRate}%
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] text-slate-500 mb-0.5">Total Repayment (P+SI)</div>
                    <div className="font-mono font-bold text-emerald-400">
                      ₹{loan.loanConfig.totalRepayment?.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      SI: ₹{loan.loanConfig.interestAmount?.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Proof Document & BRE Status Bar */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      ✓ BRE Auto-Check: PASSED
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Underwriting rules verified on submission
                    </span>
                  </div>

                  {loan.salarySlip ? (
                    <button
                      onClick={() => setPreviewSalarySlip(loan.salarySlip)}
                      className="px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium text-xs inline-flex items-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Uploaded Salary Slip</span>
                    </button>
                  ) : (
                    <span className="text-slate-500 text-[11px]">No salary slip attached</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Sanction Review (Approve / Reject) */}
        {activeLoanForReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-white text-base">
                    Underwriting Decision: {activeLoanForReview.loanId}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Applicant: {activeLoanForReview.applicantDetails.fullName} • Amount: ₹
                    {activeLoanForReview.loanConfig.amount.toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  onClick={() => setActiveLoanForReview(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* Decision radio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Underwriting Decision</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`p-3 rounded-xl border text-center cursor-pointer transition flex items-center justify-center gap-2 ${
                        decision === 'APPROVE'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="decision"
                        checked={decision === 'APPROVE'}
                        onChange={() => setDecision('APPROVE')}
                        className="sr-only"
                      />
                      <Check className="w-4 h-4" />
                      <span>Approve Sanction</span>
                    </label>

                    <label
                      className={`p-3 rounded-xl border text-center cursor-pointer transition flex items-center justify-center gap-2 ${
                        decision === 'REJECT'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="decision"
                        checked={decision === 'REJECT'}
                        onChange={() => setDecision('REJECT')}
                        className="sr-only"
                      />
                      <X className="w-4 h-4" />
                      <span>Reject Application</span>
                    </label>
                  </div>
                </div>

                {/* If REJECT, Rejection Reason is Mandatory */}
                {decision === 'REJECT' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-rose-400">
                        Mandatory Rejection Reason *
                      </label>
                    </div>
                    <select
                      required
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-rose-500/40 text-white text-xs outline-none focus:border-rose-500"
                    >
                      <option value="">Select Rejection Reason...</option>
                      <option value="Incomplete or unclear salary slip documentation">
                        Incomplete or unclear salary slip documentation
                      </option>
                      <option value="Income bank statement mismatch">
                        Income bank statement mismatch
                      </option>
                      <option value="High existing debt obligation / DTI ratio exceeded">
                        High existing debt obligation / DTI ratio exceeded
                      </option>
                      <option value="Applicant KYC address verification failed">
                        Applicant KYC address verification failed
                      </option>
                      <option value="Adverse credit bureau risk history">
                        Adverse credit bureau risk history
                      </option>
                    </select>
                  </div>
                )}

                {/* Remarks */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Executive Notes / Remarks</label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={
                      decision === 'APPROVE'
                        ? 'e.g. Salary verified against bank statement. Sanction approved.'
                        : 'e.g. Additional details on why the application was declined...'
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs placeholder:text-slate-600 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveLoanForReview(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className={`px-5 py-2 rounded-xl font-bold text-xs shadow-md transition ${
                      decision === 'APPROVE'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}
                  >
                    {actionLoading
                      ? 'Processing...'
                      : decision === 'APPROVE'
                      ? 'Confirm Sanction Approval'
                      : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Salary Slip Preview Modal */}
        <SalarySlipPreviewModal
          isOpen={!!previewSalarySlip}
          onClose={() => setPreviewSalarySlip(null)}
          salarySlip={previewSalarySlip}
        />
      </div>
    </RoleGuard>
  );
}
