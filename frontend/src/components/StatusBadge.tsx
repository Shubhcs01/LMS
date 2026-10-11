import React from 'react';
import { LoanStatus } from '../types';
import { Clock, CheckCircle2, Send, CheckCheck, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: LoanStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  const getStatusConfig = () => {
    switch (status) {
      case LoanStatus.APPLIED:
        return {
          label: 'Applied (Pending Sanction)',
          icon: Clock,
          className: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        };
      case LoanStatus.SANCTIONED:
        return {
          label: 'Sanctioned (Pending Disbursement)',
          icon: CheckCircle2,
          className: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
        };
      case LoanStatus.DISBURSED:
        return {
          label: 'Disbursed (Active / In Repayment)',
          icon: Send,
          className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        };
      case LoanStatus.CLOSED:
        return {
          label: 'Closed (Fully Repaid)',
          icon: CheckCheck,
          className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        };
      case LoanStatus.REJECTED:
        return {
          label: 'Rejected',
          icon: XCircle,
          className: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        };
      case 'NEW':
        return {
          label: 'New Lead',
          icon: Clock,
          className: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
        };
      case 'CONTACTED':
        return {
          label: 'Contacted',
          icon: CheckCircle2,
          className: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        };
      case 'DOCUMENT_PENDING':
        return {
          label: 'Document Pending',
          icon: Clock,
          className: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
        };
      case 'FOLLOW_UP_REQUIRED':
        return {
          label: 'Follow-up Required',
          icon: Clock,
          className: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        };
      case 'CONVERTED':
        return {
          label: 'Applied / Converted',
          icon: CheckCheck,
          className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        };
      case 'DROPPED':
        return {
          label: 'Dropped / BRE Failed',
          icon: XCircle,
          className: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        };
      default:
        return {
          label: status,
          icon: Clock,
          className: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full border ${sizeClasses[size]} ${config.className} transition-colors`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};
