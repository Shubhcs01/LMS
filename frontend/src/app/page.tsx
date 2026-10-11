'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  Landmark,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  CheckCircle,
  FileSpreadsheet,
  Users,
  Send,
  DollarSign,
  Receipt,
  Cpu,
  KeyRound,
} from 'lucide-react';
import { DemoAccountsModal } from '../components/DemoAccountsModal';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <div className="relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative">
        {/* Top Announcement Pill */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setShowDemoModal(true)}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium hover:bg-indigo-500/20 transition active:scale-95 shadow-sm"
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
            <span>Evaluator quick access: Test credentials pre-configured for all 6 roles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Full-Lifecycle{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Loan Management
            </span>{' '}
            & Underwriting System
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A comprehensive lending platform connecting borrowers with an intelligent 4-step loan application
            powered by an automated Business Rule Engine (BRE) and role-segregated executive operations.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              user?.role === UserRole.BORROWER ? (
                <Link
                  href="/borrower"
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/25 inline-flex items-center gap-2"
                >
                  Go to Borrower Portal <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/25 inline-flex items-center gap-2"
                >
                  Go to Operations Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              )
            ) : (
              <>
                <Link
                  href="/borrower/apply"
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/25 inline-flex items-center gap-2"
                >
                  Apply for Loan <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition inline-flex items-center gap-2"
                >
                  Operations Login
                </Link>
              </>
            )}

            <button
              onClick={() => setShowDemoModal(true)}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 font-semibold text-sm transition inline-flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              Test All Roles
            </button>
          </div>
        </div>

        {/* 2 Main Portals Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Card 1: Borrower Portal */}
          <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-indigo-500/40 transition group relative shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Borrower Application Portal</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              4-step seamless application workflow with real-time feedback and status tracking:
            </p>

            <ul className="space-y-3 text-xs text-slate-300 mb-8">
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Step 1:</strong> Secure account authentication (JWT + bcrypt)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Step 2:</strong> Personal details + Real-time server BRE verification (Age, Salary, PAN, Employment)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Step 3:</strong> Salary slip upload (PDF/JPG/PNG up to 5MB)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Step 4:</strong> Interactive loan sliders (₹50k-₹5L) with live Simple Interest formula</span>
              </li>
            </ul>

            <Link
              href="/borrower/apply"
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 group-hover:text-indigo-300 transition"
            >
              Start Borrower Application <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2: Operations Dashboard */}
          <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-purple-500/40 transition group relative shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Operations Dashboard</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              4 role-segregated modules guarding each stage of the lending lifecycle:
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs font-semibold text-blue-400 mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Sales
                </div>
                <div className="text-[11px] text-slate-400">Pre-application lead pipeline & follow-up tracking</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Sanction
                </div>
                <div className="text-[11px] text-slate-400">Review BRE, salary slip, approve/reject with reason</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Disbursement
                </div>
                <div className="text-[11px] text-slate-400">Release loan funds & log bank reference numbers</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs font-semibold text-teal-400 mb-1 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5" /> Collection
                </div>
                <div className="text-[11px] text-slate-400">Record payments with unique UTR & auto-close loan</div>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-purple-400 group-hover:text-purple-300 transition"
            >
              Enter Operations Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Business Rule Engine (BRE) Specs Section */}
        <div className="mt-16 max-w-5xl mx-auto p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Underwriting Business Rule Engine (BRE)</h2>
              <p className="text-xs text-slate-400">Enforced strictly on the server to prevent tamper and invalid risk exposure</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-xs font-semibold text-indigo-400 mb-1">Age Rule</div>
              <div className="text-sm font-bold text-white">23 to 50 Years</div>
              <div className="text-[11px] text-slate-400 mt-1">Rejects applicants younger than 23 or older than 50 based on DOB</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-xs font-semibold text-indigo-400 mb-1">Monthly Salary</div>
              <div className="text-sm font-bold text-white">Min ₹25,000 / mo</div>
              <div className="text-[11px] text-slate-400 mt-1">Rejects any declared income lower than ₹25,000 threshold</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-xs font-semibold text-indigo-400 mb-1">PAN Verification</div>
              <div className="text-sm font-bold text-white">Valid Format</div>
              <div className="text-[11px] text-slate-400 mt-1">Regex check: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-xs font-semibold text-indigo-400 mb-1">Employment Mode</div>
              <div className="text-sm font-bold text-white">Salaried / Self-Employed</div>
              <div className="text-[11px] text-slate-400 mt-1">Unemployed applicants are rejected immediately</div>
            </div>
          </div>
        </div>
      </div>

      <DemoAccountsModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />
    </div>
  );
}
