'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  Landmark,
  Shield,
  User as UserIcon,
  LogOut,
  Sparkles,
  LayoutDashboard,
  FileText,
  KeyRound,
} from 'lucide-react';
import { DemoAccountsModal } from './DemoAccountsModal';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showDemoModal, setShowDemoModal] = useState(false);

  const getRoleBadgeClass = (role?: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case UserRole.SALES:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case UserRole.SANCTION:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case UserRole.DISBURSEMENT:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case UserRole.COLLECTION:
        return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
      case UserRole.BORROWER:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Landmark className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-base tracking-tight leading-tight group-hover:text-indigo-300 transition-colors">
                  LoanOS
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                  Loan Management System
                </span>
              </div>
            </Link>

            {/* Nav links */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-1">
                {(user?.role === UserRole.BORROWER || user?.role === UserRole.ADMIN) && (
                  <Link
                    href="/borrower"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    Borrower Portal
                  </Link>
                )}

                {user?.role !== UserRole.BORROWER && (
                  <Link
                    href="/dashboard"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1.5"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                    Operations Dashboard
                  </Link>
                )}
              </nav>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Switcher Button for Evaluator */}
            <button
              onClick={() => setShowDemoModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Quickly switch between all 6 roles"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Role Switcher</span>
              <span className="inline sm:hidden">Roles</span>
            </button>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-semibold text-white leading-tight">{user.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full border font-mono font-medium ${getRoleBadgeClass(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold">
                  {user.name.charAt(0)}
                </div>

                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Evaluator Quick Switcher Modal */}
      <DemoAccountsModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />
    </>
  );
};
