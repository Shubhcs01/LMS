'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { Loan, UserRole, LoanStatus } from '../../../types';
import { RoleGuard } from '../../../components/RoleGuard';
import { StatusBadge } from '../../../components/StatusBadge';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Building2,
  CreditCard,
  IndianRupee,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function DisbursementModulePage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLoanForDisburse, setActiveLoanForDisburse] = useState<Loan | null>(null);
  const [disbursementRef, setDisbursementRef] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await api.getDisbursementQueue();
      setLoans(res.loans || []);
    } catch (e: any) {
      setFeedbackMsg({ type: 'error', text: e.message || 'Failed to fetch disbursement queue.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleDisbursementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLoanForDisburse) return;

    if (!disbursementRef.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Disbursement reference / transaction ID is required.' });
      return;
    }

    setActionLoading(true);
    setFeedbackMsg(null);

    try {
      await api.recordDisbursement(activeLoanForDisburse._id, {
        disbursementReference: disbursementRef.trim(),
        bankAccountNumber: bankAccount.trim() || undefined,
        bankIfsc: bankIfsc.trim().toUpperCase() || undefined,
        remarks: remarks.trim() || undefined,
      });

      setFeedbackMsg({
        type: 'success',
        text: `Loan ${activeLoanForDisburse.loanId} marked as DISBURSED! Funds successfully released.`,
      });

      setActiveLoanForDisburse(null);
      setDisbursementRef('');
      setBankAccount('');
      setBankIfsc('');
      setRemarks('');
      await fetchQueue();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to record disbursement.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={[UserRole.DISBURSEMENT]}>
      <div className="space-y-6 animate-fade-in">
        {/* Module Header */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">Disbursement & Treasury Module</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold font-mono">
                  Stage 3: Fund Release
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Process SANCTIONED loans, release loan proceeds to borrower bank accounts, and transition status to DISBURSED.
              </p>
            </div>
          </div>

          <div className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
            Awaiting Disbursement: <strong className="text-emerald-400">{loans.length}</strong>
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

        {/* Sanctioned Loans Queue */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading disbursement queue...</p>
          </div>
        ) : loans.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-2">
            <Send className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Loans Pending Disbursement</h3>
            <p className="text-xs text-slate-400">All sanctioned loans have already been released.</p>
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
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-mono font-bold text-white text-base">
                        {loan.loanId}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Applicant: <strong className="text-slate-200">{loan.applicantDetails.fullName}</strong> • Sanctioned on{' '}
                        {loan.sanctionDetails?.sanctionedAt
                          ? new Date(loan.sanctionDetails.sanctionedAt).toLocaleDateString()
                          : 'Recent'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={loan.status} size="md" />
                    <button
                      onClick={() => {
                        setActiveLoanForDisburse(loan);
                        setDisbursementRef(`DISB-NEFT-${Math.floor(100000 + Math.random() * 900000)}`);
                        setBankAccount('987654321012');
                        setBankIfsc('HDFC0001234');
                        setRemarks('');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-emerald-600/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Release Funds (Mark Disbursed)</span>
                    </button>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] text-slate-500 mb-0.5">Approved Amount</div>
                    <div className="font-mono font-bold text-emerald-400 text-sm">
                      ₹{loan.loanConfig.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-400">Net payout to borrower</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] text-slate-500 mb-0.5">Tenure & Rate</div>
                    <div className="font-mono font-bold text-white">
                      {loan.loanConfig.tenureDays} Days
                    </div>
                    <div className="text-[11px] text-slate-400">Fixed 12% p.a.</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] text-slate-500 mb-0.5">Total Repayment Due</div>
                    <div className="font-mono font-bold text-amber-400">
                      ₹{loan.loanConfig.totalRepayment.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      SI: ₹{loan.loanConfig.interestAmount.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] text-slate-500 mb-0.5">Sanction Underwriter</div>
                    <div className="font-medium text-white truncate">
                      {loan.sanctionDetails?.sanctionedByName || 'Sanction Executive'}
                    </div>
                    <div className="text-[10px] text-emerald-400 truncate">
                      {loan.sanctionDetails?.remarks || 'Approved'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Record Disbursement */}
        {activeLoanForDisburse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-white text-base">
                    Disburse Funds: {activeLoanForDisburse.loanId}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Beneficiary: {activeLoanForDisburse.applicantDetails.fullName} • Amount: ₹
                    {activeLoanForDisburse.loanConfig.amount.toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  onClick={() => setActiveLoanForDisburse(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleDisbursementSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Disbursement Transaction Reference (Bank UTR / NEFT Ref) *
                  </label>
                  <input
                    type="text"
                    required
                    value={disbursementRef}
                    onChange={(e) => setDisbursementRef(e.target.value)}
                    placeholder="e.g. DISB-HDFC-99881122"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white font-mono text-xs outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Target Bank Account</label>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="e.g. 987654321012"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white font-mono text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Bank IFSC Code</label>
                    <input
                      type="text"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white font-mono text-xs uppercase outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Disbursement Notes</label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Processed through treasury payout system."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white text-xs placeholder:text-slate-600 outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400">
                  Note: Upon disbursement, loan status transitions to <strong className="text-emerald-400">DISBURSED</strong> and active collections tracking starts with outstanding balance of ₹{activeLoanForDisburse.loanConfig.totalRepayment.toLocaleString('en-IN')}.
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveLoanForDisburse(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md"
                  >
                    {actionLoading ? 'Recording...' : 'Confirm Fund Release'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
