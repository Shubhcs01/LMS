'use client';

import React from 'react';
import { IndianRupee, Calendar, Percent, Calculator, ArrowRight } from 'lucide-react';

interface LoanSliderProps {
  amount: number;
  tenureDays: number;
  onAmountChange: (amount: number) => void;
  onTenureChange: (tenureDays: number) => void;
  disabled?: boolean;
}

export const LoanSlider: React.FC<LoanSliderProps> = ({
  amount,
  tenureDays,
  onAmountChange,
  onTenureChange,
  disabled = false,
}) => {
  const rate = 12; // 12% p.a. fixed

  // Simple Interest calculation: SI = (P * R * T) / (365 * 100)
  const rawInterest = (amount * rate * tenureDays) / (365 * 100);
  const interestAmount = Math.round(rawInterest * 100) / 100;
  const totalRepayment = Math.round((amount + interestAmount) * 100) / 100;
  const dailyInterest = Math.round((rawInterest / tenureDays) * 100) / 100;

  return (
    <div className="space-y-6">
      {/* 1. Loan Amount Slider */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Loan Amount
              </span>
              <p className="text-xs text-slate-500">Pick between ₹50,000 and ₹5,00,000</p>
            </div>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 font-mono font-bold text-lg">
            ₹{amount.toLocaleString('en-IN')}
          </div>
        </div>

        <div>
          <input
            type="range"
            min={50000}
            max={500000}
            step={5000}
            value={amount}
            disabled={disabled}
            onChange={(e) => onAmountChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1.5">
            <span>₹50,000 (Min)</span>
            <span>₹2,75,000</span>
            <span>₹5,00,000 (Max)</span>
          </div>
        </div>
      </div>

      {/* 2. Tenure Slider */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Tenure Duration
              </span>
              <p className="text-xs text-slate-500">Choose between 30 and 365 days</p>
            </div>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 font-mono font-bold text-lg">
            {tenureDays} Days
            <span className="text-xs text-slate-400 font-normal ml-1">
              (~{Math.round(tenureDays / 30)} mos)
            </span>
          </div>
        </div>

        <div>
          <input
            type="range"
            min={30}
            max={365}
            step={5}
            value={tenureDays}
            disabled={disabled}
            onChange={(e) => onTenureChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1.5">
            <span>30 Days (Min)</span>
            <span>180 Days</span>
            <span>365 Days (Max)</span>
          </div>
        </div>
      </div>

      {/* 3. Live Simple Interest Financial Breakdown Panel */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Calculator className="w-4 h-4" />
            <span>Live Simple Interest Calculator</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            Fixed 12% p.a.
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center mb-4">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] text-slate-400 mb-1">Principal (P)</div>
            <div className="text-sm md:text-base font-bold font-mono text-white">
              ₹{amount.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] text-slate-400 mb-1">Interest Rate (R)</div>
            <div className="text-sm md:text-base font-bold font-mono text-indigo-400">
              12% p.a.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] text-slate-400 mb-1">Interest (SI)</div>
            <div className="text-sm md:text-base font-bold font-mono text-amber-400">
              ₹{interestAmount.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] text-slate-400 mb-1">Daily Interest</div>
            <div className="text-sm md:text-base font-bold font-mono text-slate-300">
              ₹{dailyInterest.toLocaleString('en-IN')} / day
            </div>
          </div>
        </div>

        {/* Formula breakdown */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 font-mono mb-4">
          <div className="text-indigo-300 font-sans font-semibold mb-1">Simple Interest Formula Applied:</div>
          <div>SI = (P × R × T) / (365 × 100)</div>
          <div className="text-slate-500 mt-0.5">
            = ({amount.toLocaleString('en-IN')} × 12 × {tenureDays}) / 36500 = ₹{interestAmount.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Total Repayment Highlight */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-900/40 to-violet-900/40 border border-indigo-500/40 flex items-center justify-between">
          <div>
            <div className="text-xs text-indigo-300 font-medium">Total Repayment Amount (P + SI)</div>
            <div className="text-xs text-slate-400">Due at the end of {tenureDays} days</div>
          </div>
          <div className="text-xl md:text-2xl font-extrabold font-mono text-white tracking-tight">
            ₹{totalRepayment.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    </div>
  );
};
