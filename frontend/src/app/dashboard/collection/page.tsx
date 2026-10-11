'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { Loan, Payment, UserRole, LoanStatus } from '../../../types';
import { RoleGuard } from '../../../components/RoleGuard';
import { StatusBadge } from '../../../components/StatusBadge';
import {
  Receipt,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Clock,
  History,
  Send,
  Calendar,
  CreditCard,
  PlusCircle,
  Sparkles,
  CheckCheck,
} from 'lucide-react';

export default function CollectionModulePage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'CLOSED'>('ACTIVE');

  // Record Payment Modal State
  const [activeLoanForPayment, setActiveLoanForPayment] = useState<Loan | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('IMPS');
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // View Payments History Modal State
  const [activeLoanForHistory, setActiveLoanForHistory] = useState<Loan | null>(null);
  const [historyPayments, setHistoryPayments] = useState<Payment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Global feedback message
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCollectionLoans = async () => {
    try {
      setLoading(true);
      const res = await api.getCollectionQueue();
      setLoans(res.loans || []);
    } catch (e: any) {
      setFeedbackMsg({ type: 'error', text: e.message || 'Failed to fetch collection loans.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollectionLoans();
  }, []);

  const openPaymentModal = (loan: Loan) => {
    setActiveLoanForPayment(loan);
    // Generate sample unique UTR format: UTR-YYYYMMDD-XXXX
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    setUtrNumber(`UTR${dateStr}${randomSuffix}`);
    setAmount(loan.repaymentDetails.outstandingBalance); // default to remaining balance for 1-click test
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('IMPS');
    setRemarks('');
    setModalError(null);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLoanForPayment) return;

    if (!utrNumber.trim()) {
      setModalError('UTR Number is required.');
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setModalError('Payment amount must be greater than 0.');
      return;
    }

    if (numAmount > activeLoanForPayment.repaymentDetails.outstandingBalance) {
      setModalError(
        `Amount ₹${numAmount.toLocaleString('en-IN')} exceeds remaining outstanding balance of ₹${activeLoanForPayment.repaymentDetails.outstandingBalance.toLocaleString('en-IN')}.`
      );
      return;
    }

    setActionLoading(true);
    setModalError(null);

    try {
      const res = await api.recordPayment({
        loanId: activeLoanForPayment._id,
        utrNumber: utrNumber.trim().toUpperCase(),
        amount: numAmount,
        paymentDate,
        paymentMode,
        remarks: remarks || undefined,
      });

      if (res.loan.autoClosed) {
        setFeedbackMsg({
          type: 'success',
          text: `🎉 Payment recorded successfully! Full repayment received — Loan ${activeLoanForPayment.loanId} has been AUTO-CLOSED!`,
        });
      } else {
        setFeedbackMsg({
          type: 'success',
          text: `Payment of ₹${numAmount.toLocaleString('en-IN')} recorded! Remaining balance: ₹${res.loan.repaymentDetails.outstandingBalance.toLocaleString('en-IN')}.`,
        });
      }

      setActiveLoanForPayment(null);
      await fetchCollectionLoans();
    } catch (err: any) {
      setModalError(err.message || 'Failed to record payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const openHistoryModal = async (loan: Loan) => {
    setActiveLoanForHistory(loan);
    setHistoryLoading(true);
    try {
      const res = await api.getPaymentsByLoan(loan._id);
      setHistoryPayments(res.payments || []);
    } catch (e: any) {
      console.error('Failed to fetch payments:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const activeLoans = loans.filter((l) => l.status === LoanStatus.DISBURSED);
  const closedLoans = loans.filter((l) => l.status === LoanStatus.CLOSED);

  const displayedLoans = activeTab === 'ACTIVE' ? activeLoans : closedLoans;

  return (
    <RoleGuard allowedRoles={[UserRole.COLLECTION]}>
      <div className="space-y-6 animate-fade-in">
        {/* Module Header */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">Collection & Recovery Module</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold font-mono">
                  Stage 4: Loan Servicing
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Track active DISBURSED loans, record repayments with unique UTR numbers, validate balances, and trigger automatic loan closure.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'ACTIVE'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              Active Portfolio ({activeLoans.length})
            </button>
            <button
              onClick={() => setActiveTab('CLOSED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'CLOSED'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              Closed Loans ({closedLoans.length})
            </button>
          </div>
        </div>

        {feedbackMsg && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-md shadow-emerald-500/10'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {feedbackMsg.type === 'success' ? <Sparkles className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
            <span className="font-medium">{feedbackMsg.text}</span>
          </div>
        )}

        {/* Loans Table */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading collection portfolio...</p>
          </div>
        ) : displayedLoans.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-2">
            <Receipt className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">
              {activeTab === 'ACTIVE' ? 'No Active Disbursed Loans' : 'No Closed Loans Yet'}
            </h3>
            <p className="text-xs text-slate-400">
              {activeTab === 'ACTIVE'
                ? 'Loans will appear here once disbursed in the Disbursement module.'
                : 'Loans will transition to closed automatically once fully paid.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedLoans.map((loan) => (
              <div
                key={loan._id}
                className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-5 shadow-sm"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-mono font-bold text-white text-base">
                        {loan.loanId}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Borrower: <strong className="text-slate-200">{loan.applicantDetails.fullName}</strong> •{' '}
                        {loan.disbursementDetails?.disbursedAt
                          ? `Disbursed on ${new Date(loan.disbursementDetails.disbursedAt).toLocaleDateString()}`
                          : 'Active'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={loan.status} size="md" />

                    {loan.status === LoanStatus.DISBURSED && (
                      <button
                        onClick={() => openPaymentModal(loan)}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-teal-600/20"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Record Payment</span>
                      </button>
                    )}

                    <button
                      onClick={() => openHistoryModal(loan)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium inline-flex items-center gap-1.5 transition"
                      title="View payment history"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Ledger</span>
                    </button>
                  </div>
                </div>

                {/* Balances & Repayment Progress Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] text-slate-500 mb-0.5">Total Repayment Due</div>
                    <div className="font-mono font-bold text-white text-sm">
                      ₹{loan.repaymentDetails.totalRepayment?.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-400">Principal + Simple Interest</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] text-slate-500 mb-0.5">Total Amount Collected</div>
                    <div className="font-mono font-bold text-emerald-400 text-sm">
                      ₹{loan.repaymentDetails.totalPaid?.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-emerald-400">
                      {Math.round((loan.repaymentDetails.totalPaid / loan.repaymentDetails.totalRepayment) * 100)}% repaid
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] text-slate-500 mb-0.5">Outstanding Balance</div>
                    <div className="font-mono font-bold text-amber-400 text-sm">
                      ₹{loan.repaymentDetails.outstandingBalance?.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-400">Remaining to settle</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="text-[10px] text-slate-500 mb-0.5">Last Payment Date</div>
                    <div className="font-mono text-white">
                      {loan.repaymentDetails.lastPaymentDate
                        ? new Date(loan.repaymentDetails.lastPaymentDate).toLocaleDateString()
                        : 'No payments yet'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Ref: {loan.disbursementDetails?.disbursementReference}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Repayment Progress</span>
                    <span className="font-mono">
                      ₹{loan.repaymentDetails.totalPaid?.toLocaleString('en-IN')} / ₹
                      {loan.repaymentDetails.totalRepayment?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        loan.status === LoanStatus.CLOSED ? 'bg-blue-500' : 'bg-teal-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((loan.repaymentDetails.totalPaid / loan.repaymentDetails.totalRepayment) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Record Payment */}
        {activeLoanForPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-white text-base">
                    Record Borrower Payment: {activeLoanForPayment.loanId}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Borrower: {activeLoanForPayment.applicantDetails.fullName} • Outstanding:{' '}
                    <strong className="text-amber-400">
                      ₹{activeLoanForPayment.repaymentDetails.outstandingBalance.toLocaleString('en-IN')}
                    </strong>
                  </p>
                </div>
                <button
                  onClick={() => setActiveLoanForPayment(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleRecordPayment} className="space-y-4">
                {/* UTR Number */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-slate-300">
                      Unique Transaction Reference (UTR Number) *
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">Must be globally unique</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. UTR202610091234"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white font-mono text-xs uppercase outline-none"
                  />
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-slate-300">Payment Amount (₹) *</label>
                    <button
                      type="button"
                      onClick={() => setAmount(activeLoanForPayment.repaymentDetails.outstandingBalance)}
                      className="text-[10px] text-teal-400 hover:text-teal-300 underline font-semibold"
                    >
                      Fill Full Balance (₹{activeLoanForPayment.repaymentDetails.outstandingBalance.toLocaleString('en-IN')})
                    </button>
                  </div>
                  <input
                    type="number"
                    required
                    min={1}
                    max={activeLoanForPayment.repaymentDetails.outstandingBalance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 25000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs outline-none"
                  />
                  {Number(amount) === activeLoanForPayment.repaymentDetails.outstandingBalance && (
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium pt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>This payment will clear 100% of the loan and trigger AUTO-CLOSE!</span>
                    </div>
                  )}
                </div>

                {/* Payment Date & Mode */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Payment Date</label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Payment Channel</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs outline-none"
                    >
                      <option value="IMPS">IMPS</option>
                      <option value="NEFT">NEFT</option>
                      <option value="RTGS">RTGS</option>
                      <option value="UPI">UPI</option>
                      <option value="NetBanking">NetBanking</option>
                    </select>
                  </div>
                </div>

                {/* Remarks */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Collection Notes</label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Borrower paid via bank transfer..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white text-xs placeholder:text-slate-600 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveLoanForPayment(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-md"
                  >
                    {actionLoading ? 'Recording...' : 'Submit Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: View Payment History Ledger */}
        {activeLoanForHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-white text-base">
                    Payment Ledger: {activeLoanForHistory.loanId}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Applicant: {activeLoanForHistory.applicantDetails.fullName} • Status:{' '}
                    {activeLoanForHistory.status}
                  </p>
                </div>
                <button
                  onClick={() => setActiveLoanForHistory(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {historyLoading ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading ledger records...</div>
                ) : historyPayments.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">No payments recorded yet.</div>
                ) : (
                  <div className="space-y-2">
                    {historyPayments.map((p) => (
                      <div
                        key={p._id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-teal-400">
                              ₹{p.amount.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                              {p.paymentMode}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            UTR: <strong className="text-white">{p.utrNumber}</strong>
                          </div>
                          {p.remarks && <p className="text-[11px] text-slate-500">{p.remarks}</p>}
                        </div>

                        <div className="text-right space-y-0.5">
                          <div className="text-[11px] text-slate-300">
                            {new Date(p.paymentDate).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Recorded by: {p.recordedByName}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">
                  Total Collected:{' '}
                  <strong className="text-emerald-400 font-mono">
                    ₹{activeLoanForHistory.repaymentDetails.totalPaid.toLocaleString('en-IN')}
                  </strong>
                </span>
                <button
                  onClick={() => setActiveLoanForHistory(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Close Ledger
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
