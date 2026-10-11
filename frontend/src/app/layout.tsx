import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';

export const metadata: Metadata = {
  title: 'LoanOS — Modern Loan Management System & Underwriting Platform',
  description:
    'End-to-end lending platform featuring multi-step borrower applications, automated Business Rule Engine (BRE), and role-based operations dashboard for Sales, Sanction, Disbursement, and Collection teams.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white flex flex-col font-sans">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-slate-400">LoanOS</span> — Loan Management System Assignment
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <span>RBAC Enforced</span>
                <span>•</span>
                <span>Automated BRE Underwriting</span>
                <span>•</span>
                <span>Simple Interest Engine</span>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
