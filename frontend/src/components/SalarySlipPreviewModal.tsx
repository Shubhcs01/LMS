'use client';

import React from 'react';
import { X, FileText, Download, ExternalLink } from 'lucide-react';
import { BACKEND_URL } from '../lib/api';

interface SalarySlipPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  salarySlip?: {
    filename?: string;
    originalName?: string;
    path?: string;
    mimetype?: string;
    size?: number;
    uploadedAt?: string;
  };
}

export const SalarySlipPreviewModal: React.FC<SalarySlipPreviewModalProps> = ({
  isOpen,
  onClose,
  salarySlip,
}) => {
  if (!isOpen || !salarySlip) return null;

  // Resolve file URL
  const fileUrl = salarySlip.path?.startsWith('http')
    ? salarySlip.path
    : `${BACKEND_URL}/${salarySlip.path || 'uploads/' + salarySlip.filename}`;

  const isPdf = salarySlip.mimetype === 'application/pdf' || salarySlip.filename?.endsWith('.pdf');
  const isImage =
    salarySlip.mimetype?.startsWith('image/') ||
    salarySlip.filename?.endsWith('.jpg') ||
    salarySlip.filename?.endsWith('.jpeg') ||
    salarySlip.filename?.endsWith('.png');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">
                {salarySlip.originalName || salarySlip.filename || 'Salary Slip Document'}
              </h3>
              <p className="text-xs text-slate-400">
                Uploaded: {salarySlip.uploadedAt ? new Date(salarySlip.uploadedAt).toLocaleString() : 'N/A'} •{' '}
                {salarySlip.size ? `${(salarySlip.size / 1024).toFixed(1)} KB` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950/60 flex items-center justify-center min-h-[400px]">
          {isImage ? (
            <img
              src={fileUrl}
              alt="Salary Slip Preview"
              className="max-w-full max-h-[70vh] rounded-lg border border-slate-800 object-contain shadow"
            />
          ) : isPdf ? (
            <iframe
              src={fileUrl}
              title="PDF Preview"
              className="w-full h-[65vh] rounded-lg border border-slate-800"
            />
          ) : (
            <div className="text-center p-8 space-y-3">
              <FileText className="w-12 h-12 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-300">Preview not directly available for this format.</p>
              <a
                href={fileUrl}
                download
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
              >
                <Download className="w-4 h-4" /> Download File
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs text-slate-400">
          <span>Official Proof of Income Document</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
