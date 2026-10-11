'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ShieldAlert, ArrowLeft, Users, LogIn } from 'lucide-react';
import Link from 'next/link';
import { DemoAccountsModal } from './DemoAccountsModal';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [showDemoModal, setShowDemoModal] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Verifying role permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-xl">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
          <p className="text-sm text-slate-400 mb-6">
            You must be logged in to view this module.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition shadow-sm inline-flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Go to Login
            </Link>
            <button
              onClick={() => setShowDemoModal(true)}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm rounded-xl transition inline-flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" /> Open Evaluator Quick Login
            </button>
          </div>
          <DemoAccountsModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />
        </div>
      </div>
    );
  }

  // Admin has access to everything
  const hasAccess = user.role === UserRole.ADMIN || allowedRoles.includes(user.role);

  if (!hasAccess) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 md:p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
          <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="inline-block px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2">
            HTTP 403 Forbidden • Role Restricted
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied by RBAC Policy</h2>
          <p className="text-sm text-slate-400 mb-6">
            Your current authenticated role is <strong className="text-indigo-400 font-semibold">{user.role}</strong>. This module strictly requires one of the following roles:
          </p>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 mb-6 text-left">
            <div className="text-xs text-slate-400 mb-1">Allowed Roles for this Module:</div>
            <div className="flex flex-wrap gap-1.5">
              {allowedRoles.map((role) => (
                <span
                  key={role}
                  className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono font-medium"
                >
                  {role}
                </span>
              ))}
              <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-mono font-medium">
                Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Note: The backend API also rejects unauthorized requests with status 403.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={user.role === UserRole.BORROWER ? '/borrower' : '/dashboard'}
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm rounded-xl transition inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Go to My Allowed Portal
            </Link>
            <button
              onClick={() => setShowDemoModal(true)}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition inline-flex items-center justify-center gap-2 shadow-sm"
            >
              <Users className="w-4 h-4" /> Switch Test Account
            </button>
          </div>

          <DemoAccountsModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
