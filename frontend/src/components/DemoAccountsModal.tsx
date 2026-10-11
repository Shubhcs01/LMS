'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Shield, UserCheck, CheckCircle2, X } from 'lucide-react';

interface DemoAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoAccountsModal: React.FC<DemoAccountsModalProps> = ({ isOpen, onClose }) => {
  const { switchRole } = useAuth();

  if (!isOpen) return null;

  const accounts = [
    {
      role: UserRole.ADMIN,
      name: 'Aditya Birla',
      email: 'admin@lms.com',
      password: 'Password@123',
      description: 'Super-user access. Can access all 4 operations modules, view financial aggregates, and audit logs.',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    },
    {
      role: UserRole.SALES,
      name: 'Sanjay Kapoor',
      email: 'sales@lms.com',
      password: 'Password@123',
      description: 'Pre-application lead tracking. Tracks registered users who have not completed their loan application.',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    },
    {
      role: UserRole.SANCTION,
      name: 'Ananya Verma',
      email: 'sanction@lms.com',
      password: 'Password@123',
      description: 'Reviews APPLIED loans, inspects BRE results & salary slips, and approves or rejects with reason.',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
    {
      role: UserRole.DISBURSEMENT,
      name: 'Vikram Malhotra',
      email: 'disbursement@lms.com',
      password: 'Password@123',
      description: 'Reviews SANCTIONED loans and marks funds as DISBURSED with bank transaction reference.',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    },
    {
      role: UserRole.COLLECTION,
      name: 'Pooja Hegde',
      email: 'collection@lms.com',
      password: 'Password@123',
      description: 'Handles active DISBURSED loans, records repayments with unique UTR, and triggers auto-closure.',
      badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    },
    {
      role: UserRole.BORROWER,
      name: 'Rahul Sharma',
      email: 'borrower@lms.com',
      password: 'Password@123',
      description: 'Borrower portal view. Has an active loan in repayment so you can inspect borrower loan status tracking.',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    },
  ];

  const handleQuickLogin = async (role: UserRole) => {
    await switchRole(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Evaluator Quick Login Hub</h2>
              <p className="text-xs text-slate-400">Pre-seeded role accounts for immediate testing with 1-click login</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2">
          <UserCheck className="w-4 h-4 shrink-0 text-indigo-400" />
          <span>Click <strong>"Switch to Role"</strong> to immediately authenticate as that role and test access control!</span>
        </div>

        <div className="mt-4 space-y-3">
          {accounts.map((acc) => (
            <div
              key={acc.role}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${acc.badgeColor}`}>
                    {acc.role}
                  </span>
                  <span className="font-semibold text-white text-sm">{acc.name}</span>
                </div>
                <div className="text-xs text-slate-400">
                  <span className="text-slate-300 font-mono">{acc.email}</span> • Password:{' '}
                  <span className="text-slate-300 font-mono">{acc.password}</span>
                </div>
                <p className="text-xs text-slate-500">{acc.description}</p>
              </div>

              <button
                onClick={() => handleQuickLogin(acc.role)}
                className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition active:scale-95 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Switch to {acc.role}</span>
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
