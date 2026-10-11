'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { RoleGuard } from '../../components/RoleGuard';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Send,
  Receipt,
  Lock,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const navItems = [
    {
      title: 'Sales (Leads)',
      href: '/dashboard/sales',
      icon: Users,
      role: UserRole.SALES,
      color: 'text-blue-400',
      activeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      description: 'Pre-application lead pipeline',
    },
    {
      title: 'Sanction',
      href: '/dashboard/sanction',
      icon: ShieldCheck,
      role: UserRole.SANCTION,
      color: 'text-amber-400',
      activeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      description: 'Underwrite APPLIED loans',
    },
    {
      title: 'Disbursement',
      href: '/dashboard/disbursement',
      icon: Send,
      role: UserRole.DISBURSEMENT,
      color: 'text-emerald-400',
      activeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      description: 'Release funds for SANCTIONED loans',
    },
    {
      title: 'Collection',
      href: '/dashboard/collection',
      icon: Receipt,
      role: UserRole.COLLECTION,
      color: 'text-teal-400',
      activeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
      description: 'Record repayments & auto-close',
    },
  ];

  return (
    <RoleGuard
      allowedRoles={[
        UserRole.ADMIN,
        UserRole.SALES,
        UserRole.SANCTION,
        UserRole.DISBURSEMENT,
        UserRole.COLLECTION,
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Nav */}
          <aside className="w-full lg:w-64 shrink-0 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Operations Modules
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  RBAC Mode
                </span>
              </div>

              {/* Admin Overview Link */}
              {user?.role === UserRole.ADMIN && (
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-semibold transition ${
                    pathname === '/dashboard'
                      ? 'bg-purple-500/10 text-purple-300 border-purple-500/30 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-purple-400" />
                  <span>Admin Overview</span>
                </Link>
              )}

              {/* Module links */}
              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const hasAccess = user?.role === UserRole.ADMIN || user?.role === item.role;
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  if (!hasAccess) {
                    return (
                      <div
                        key={item.href}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-900 bg-slate-950/30 text-slate-600 text-xs cursor-not-allowed select-none"
                        title={`Locked: Requires ${item.role} role`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-slate-600" />
                          <span>{item.title}</span>
                        </div>
                        <Lock className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-semibold transition ${
                        isActive
                          ? item.activeColor
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                        <span>{item.title}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Active User Persona Card */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Current Authenticated Role
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{user?.name}</span>
              </div>
              <div className="text-[11px] font-mono text-indigo-400">Role: {user?.role}</div>
              <p className="text-[10px] text-slate-500 leading-relaxed pt-1 border-t border-slate-800">
                {user?.role === UserRole.ADMIN
                  ? 'Admin access: All 4 modules are accessible.'
                  : `Executive access: Guarded strictly to the ${user?.role} module.`}
              </p>
            </div>
          </aside>

          {/* Main Module Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
