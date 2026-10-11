'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { api } from '../../lib/api';
import {
  Users,
  ShieldCheck,
  Send,
  Receipt,
  IndianRupee,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  CheckCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // If user has a single executive role, auto-redirect them directly to their assigned module
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      switch (user.role) {
        case UserRole.SALES:
          router.replace('/dashboard/sales');
          break;
        case UserRole.SANCTION:
          router.replace('/dashboard/sanction');
          break;
        case UserRole.DISBURSEMENT:
          router.replace('/dashboard/disbursement');
          break;
        case UserRole.COLLECTION:
          router.replace('/dashboard/collection');
          break;
      }
    }
  }, [user, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.getDashboardStats();
        setStats(res);
      } catch (e) {
        console.error('Failed to load dashboard statistics:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold font-mono">
            System Admin Executive Console
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Operations Portfolio Overview</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          Real-time underwriting metrics, portfolio performance, and pipeline throughput across all 4 lifecycle stages.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Applied */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Applied</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats?.counts?.applied ?? 0}
          </div>
          <p className="text-[11px] text-slate-500">Awaiting sanction review</p>
        </div>

        {/* Sanctioned */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sanctioned</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats?.counts?.sanctioned ?? 0}
          </div>
          <p className="text-[11px] text-slate-500">Awaiting disbursement</p>
        </div>

        {/* Disbursed */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Disbursed</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats?.counts?.disbursed ?? 0}
          </div>
          <p className="text-[11px] text-slate-500">Active portfolio loans</p>
        </div>

        {/* Closed */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Closed</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <CheckCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats?.counts?.closed ?? 0}
          </div>
          <p className="text-[11px] text-slate-500">Fully recovered loans</p>
        </div>
      </div>

      {/* Financial Aggregates */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-indigo-400" />
          <span>Financial Portfolio Aggregates</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1">Total Principal Disbursed</div>
            <div className="text-xl font-bold font-mono text-white">
              ₹{(stats?.financials?.totalPrincipalDisbursed ?? 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1">Total Collections Received</div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              ₹{(stats?.financials?.totalCollected ?? 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1">Active Outstanding Balance</div>
            <div className="text-xl font-bold font-mono text-amber-400">
              ₹{(stats?.financials?.totalOutstanding ?? 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Module Launchpad Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Direct Module Access (Admin Privileges)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sales */}
          <Link
            href="/dashboard/sales"
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Sales Module</h3>
                <p className="text-xs text-slate-400">Pre-application lead tracking & follow-ups</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition" />
          </Link>

          {/* Sanction */}
          <Link
            href="/dashboard/sanction"
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Sanction Module</h3>
                <p className="text-xs text-slate-400">Underwrite applied loans (approve/reject)</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
          </Link>

          {/* Disbursement */}
          <Link
            href="/dashboard/disbursement"
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Disbursement Module</h3>
                <p className="text-xs text-slate-400">Release funds for sanctioned loans</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
          </Link>

          {/* Collection */}
          <Link
            href="/dashboard/collection"
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 group-hover:scale-105 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Collection Module</h3>
                <p className="text-xs text-slate-400">Record payments with unique UTR & auto-close</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition" />
          </Link>
        </div>
      </div>
    </div>
  );
}
