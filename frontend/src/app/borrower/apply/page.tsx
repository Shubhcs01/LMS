'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { api, BACKEND_URL } from '../../../lib/api';
import { EmploymentMode, BREResult, UserRole } from '../../../types';
import { LoanSlider } from '../../../components/LoanSlider';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  FileCheck,
  ShieldCheck,
  ShieldAlert,
  User as UserIcon,
  CreditCard,
  Calendar,
  Briefcase,
  IndianRupee,
  Sparkles,
  Lock,
} from 'lucide-react';
import Link from 'next/link';

export default function ApplyLoanPage() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<number>(2);

  // Step 2 Form States
  const [fullName, setFullName] = useState('');
  const [pan, setPan] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [monthlySalary, setMonthlySalary] = useState<number | ''>('');
  const [employmentMode, setEmploymentMode] = useState<EmploymentMode | ''>('');
  const [breLoading, setBreLoading] = useState(false);
  const [breResult, setBreResult] = useState<BREResult | null>(null);
  const [breError, setBreError] = useState<string | null>(null);

  // Step 3 File Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadedFileRecord, setUploadedFileRecord] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Step 4 Loan Configuration
  const [amount, setAmount] = useState<number>(100000);
  const [tenureDays, setTenureDays] = useState<number>(90);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccessLoan, setApplySuccessLoan] = useState<any>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Initialize form with existing user data if available
  useEffect(() => {
    if (user) {
      if (user.name) setFullName(user.name);
      if (user.pan) setPan(user.pan);
      if (user.dateOfBirth) {
        setDateOfBirth(new Date(user.dateOfBirth).toISOString().split('T')[0]);
      }
      if (user.monthlySalary) setMonthlySalary(user.monthlySalary);
      if (user.employmentMode) setEmploymentMode(user.employmentMode);
    }
  }, [user]);

  // Step 2: Handle BRE Verification
  const handleBRESubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBreError(null);
    setBreResult(null);
    setBreLoading(true);

    try {
      const res = await api.checkEligibilityAndSave({
        fullName,
        pan: pan.trim().toUpperCase(),
        dateOfBirth,
        monthlySalary: Number(monthlySalary),
        employmentMode: employmentMode as string,
      });

      setBreResult(res.breResult);
      await refreshUser();
      // Auto advance to step 3 on pass
      setTimeout(() => {
        setCurrentStep(3);
      }, 1000);
    } catch (err: any) {
      if (err.data && err.data.breResult) {
        setBreResult(err.data.breResult);
        setBreError(err.data.message || 'Business Rule Engine eligibility check failed.');
      } else {
        setBreError(err.message || 'Failed to submit personal details.');
      }
    } finally {
      setBreLoading(false);
    }
  };

  // Step 3: Handle Salary Slip Upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setUploadError(null);
    setUploadLoading(true);

    try {
      const res = await api.uploadSalarySlip(selectedFile);
      setUploadedFileRecord(res.file);
      await refreshUser();
      setTimeout(() => {
        setCurrentStep(4);
      }, 800);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload salary slip.');
    } finally {
      setUploadLoading(false);
    }
  };

  // Step 4: Submit Final Loan Application
  const handleFinalApply = async () => {
    setApplyError(null);
    setApplyLoading(true);

    try {
      const res = await api.applyLoan({
        amount,
        tenureDays,
        salarySlip: uploadedFileRecord || undefined,
      });

      setApplySuccessLoan(res.loan);
      await refreshUser();
    } catch (err: any) {
      setApplyError(err.message || 'Failed to submit loan application.');
    } finally {
      setApplyLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Sign In Required</h2>
        <p className="text-xs text-slate-400">
          Step 1: Please register or log in with your borrower account before applying.
        </p>
        <div className="flex gap-3 pt-2">
          <Link
            href="/signup"
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
          >
            Create Account
          </Link>
          <Link
            href="/login"
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  // Application Success Celebration Screen
  if (applySuccessLoan) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-3xl bg-slate-900 border border-indigo-500/40 shadow-2xl space-y-6 text-center animate-fade-in relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold font-mono">
            STATUS: {applySuccessLoan.status}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Application Submitted Successfully!</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Your loan application has been created and assigned to the Sanction Underwriting queue for review.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-xs text-slate-400">Application / Loan ID:</span>
            <span className="font-mono font-bold text-white text-sm">{applySuccessLoan.loanId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Principal Amount:</span>
            <span className="font-mono font-bold text-indigo-400 text-sm">
              ₹{applySuccessLoan.loanConfig?.amount?.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Tenure Duration:</span>
            <span className="font-mono text-slate-200 text-xs">
              {applySuccessLoan.loanConfig?.tenureDays} Days (at 12% p.a.)
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Calculated Simple Interest:</span>
            <span className="font-mono text-amber-400 text-xs">
              ₹{applySuccessLoan.loanConfig?.interestAmount?.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-300">Total Repayment Due:</span>
            <span className="font-mono font-extrabold text-white text-base">
              ₹{applySuccessLoan.loanConfig?.totalRepayment?.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/borrower"
            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/20 inline-flex items-center justify-center gap-2"
          >
            View Loan in Borrower Portal <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition inline-flex items-center justify-center gap-2"
          >
            Switch to Operations Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { number: 1, title: 'Auth', desc: 'Account Setup' },
    { number: 2, title: 'Personal Details & BRE', desc: 'Rule Engine Check' },
    { number: 3, title: 'Upload Salary Slip', desc: 'Income Proof' },
    { number: 4, title: 'Loan Config & Apply', desc: 'Live Calculator' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Multi-step Header */}
      <div className="space-y-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Borrower Application Journey
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Apply for an Instant Loan
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Complete the 4 stages below to evaluate your underwriting eligibility and submit your loan request.
          </p>
        </div>

        {/* Progress Bar / Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          {steps.map((st) => {
            const isCompleted = st.number < currentStep || (st.number === 1 && isAuthenticated);
            const isCurrent = st.number === currentStep;

            return (
              <button
                key={st.number}
                type="button"
                onClick={() => {
                  // Only allow clicking to past or completed steps
                  if (st.number <= currentStep) {
                    setCurrentStep(st.number);
                  }
                }}
                className={`p-3 rounded-2xl border text-left transition ${
                  isCurrent
                    ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md'
                    : isCompleted
                    ? 'bg-slate-900 border-emerald-500/30 text-slate-300'
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-500 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isCurrent
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : st.number}
                  </div>
                  <span className="text-xs font-bold truncate">{st.title}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate pl-8">{st.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: AUTH CONFIRMATION */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Authenticated as {user?.name}</h3>
              <p className="text-xs text-slate-400 font-mono">{user?.email} • Role: {user?.role}</p>
            </div>
          </div>
          <p className="text-xs text-slate-300">
            Step 1 is already completed! Your borrower credentials have been authenticated. Proceed to Step 2 to submit your personal details for underwriting.
          </p>
          <button
            onClick={() => setCurrentStep(2)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2"
          >
            <span>Proceed to Step 2</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: PERSONAL DETAILS & BUSINESS RULE ENGINE (BRE) */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold uppercase">
                Step 2 of 4
              </span>
              <h2 className="text-xl font-bold text-white mt-1">Personal Details & Underwriting Check</h2>
              <p className="text-xs text-slate-400">
                The Business Rule Engine (BRE) verifies applicant age, monthly salary, PAN format, and employment mode.
              </p>
            </div>
          </div>

          {/* BRE Rule Explanations Banner */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
            <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Underwriting Rules Enforced by Server:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400">
              <div>• Age: <strong>23 to 50 years</strong></div>
              <div>• Salary: <strong>Min ₹25,000/mo</strong></div>
              <div>• PAN: <strong>Valid ABCDE1234F</strong></div>
              <div>• Mode: <strong>Salaried / Self-Employed</strong></div>
            </div>
          </div>

          {/* BRE Rejection Alert Card if failed */}
          {breResult && !breResult.passed && (
            <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-400">
                <ShieldAlert className="w-5 h-5" />
                <span>BRE Eligibility Check Failed — Application Blocked</span>
              </div>
              <p className="text-xs text-rose-300">
                The applicant does not satisfy our minimum underwriting requirements. See check breakdown:
              </p>
              <div className="space-y-1.5 text-xs">
                {breResult.rejectionReasons.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-rose-950/40 p-2 rounded-lg border border-rose-500/20">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BRE Success Card if passed */}
          {breResult && breResult.passed && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <span>All Underwriting Checks Passed Successfully!</span>
              </div>
              <p className="text-xs text-emerald-300">
                Calculated Age: <strong>{breResult.age} years</strong> • All 4 rules satisfied. Advancing to Step 3...
              </p>
            </div>
          )}

          <form onSubmit={handleBRESubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Full Legal Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-sm outline-none transition"
                  />
                </div>
              </div>

              {/* PAN Number */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-slate-300">PAN Number</label>
                  <span className="text-[10px] text-slate-500 font-mono">Format: 5 letters, 4 digits, 1 letter</span>
                </div>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-mono text-sm uppercase outline-none transition"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-slate-300">Date of Birth</label>
                  <span className="text-[10px] text-slate-500">Must be age 23 – 50</span>
                </div>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-sm outline-none transition"
                  />
                </div>
              </div>

              {/* Monthly Salary */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-slate-300">Monthly Net Salary (₹)</label>
                  <span className="text-[10px] text-slate-500">Min threshold: ₹25,000</span>
                </div>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    required
                    min={0}
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 50000"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-sm outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Employment Mode */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-medium text-slate-300">Employment Mode</label>
              <div className="grid grid-cols-3 gap-3">
                {[EmploymentMode.SALARIED, EmploymentMode.SELF_EMPLOYED, EmploymentMode.UNEMPLOYED].map(
                  (mode) => (
                    <label
                      key={mode}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition flex flex-col items-center gap-1 ${
                        employmentMode === mode
                          ? mode === EmploymentMode.UNEMPLOYED
                            ? 'bg-rose-500/10 border-rose-500 text-rose-300'
                            : 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="employmentMode"
                        value={mode}
                        checked={employmentMode === mode}
                        onChange={(e) => setEmploymentMode(e.target.value as EmploymentMode)}
                        className="sr-only"
                      />
                      <Briefcase className="w-4 h-4 mb-0.5" />
                      <span className="text-xs font-semibold">{mode}</span>
                      {mode === EmploymentMode.UNEMPLOYED && (
                        <span className="text-[9px] text-rose-400 font-medium">(Will trigger BRE rejection)</span>
                      )}
                    </label>
                  )
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <div className="text-[11px] text-slate-500">
                All fields are audited and evaluated via backend BRE rules.
              </div>
              <button
                type="submit"
                disabled={breLoading}
                className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/20 flex items-center gap-2"
              >
                {breLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Run Server BRE Evaluation</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: UPLOAD SALARY SLIP */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold uppercase">
                Step 3 of 4
              </span>
              <h2 className="text-xl font-bold text-white mt-1">Upload Salary Slip / Proof of Income</h2>
              <p className="text-xs text-slate-400">
                Upload your latest salary slip or bank statement for underwriter review (PDF, JPG, or PNG, max 5 MB).
              </p>
            </div>
          </div>

          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <form onSubmit={handleFileUpload} className="space-y-6">
            <div className="p-8 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-3xl text-center space-y-4 bg-slate-950/60 transition cursor-pointer relative">
              <input
                type="file"
                required
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                    setUploadError(null);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">
                  {selectedFile ? selectedFile.name : 'Click to select or drag and drop document'}
                </h4>
                <p className="text-xs text-slate-400">
                  {selectedFile
                    ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to upload`
                    : 'Accepted formats: PDF, JPG, PNG (Max size: 5 MB)'}
                </p>
              </div>
            </div>

            {uploadedFileRecord && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  <span>Salary slip uploaded: <strong>{uploadedFileRecord.originalName}</strong></span>
                </div>
                <span className="text-[11px] text-emerald-300">Ready</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Step 2</span>
              </button>

              <button
                type="submit"
                disabled={uploadLoading || !selectedFile}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/20 flex items-center gap-2"
              >
                {uploadLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Upload & Continue to Step 4</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: LOAN CONFIGURATION & APPLY */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold uppercase">
                Step 4 of 4
              </span>
              <h2 className="text-xl font-bold text-white mt-1">Loan Configuration & Final Submission</h2>
              <p className="text-xs text-slate-400">
                Select your required amount and repayment tenure. Live calculations use Simple Interest at 12% p.a.
              </p>
            </div>
          </div>

          {applyError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{applyError}</span>
            </div>
          )}

          {/* Interactive Loan Sliders and Live Math Panel */}
          <LoanSlider
            amount={amount}
            tenureDays={tenureDays}
            onAmountChange={setAmount}
            onTenureChange={setTenureDays}
          />

          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Step 3</span>
            </button>

            <button
              type="button"
              onClick={handleFinalApply}
              disabled={applyLoading}
              className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm transition shadow-lg shadow-emerald-600/30 flex items-center gap-2"
            >
              {applyLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Apply for ₹{amount.toLocaleString('en-IN')} Loan</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
