'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { Lead, UserRole } from '../../../types';
import { RoleGuard } from '../../../components/RoleGuard';
import { StatusBadge } from '../../../components/StatusBadge';
import {
  Users,
  Search,
  Filter,
  MessageSquare,
  Clock,
  Phone,
  Mail,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function SalesModulePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeLeadForNote, setActiveLeadForNote] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.getLeads({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setLeads(res.leads || []);
    } catch (e: any) {
      setFeedbackMsg({ type: 'error', text: e.message || 'Failed to fetch leads.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads();
  };

  const handleUpdateStatusAndNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLeadForNote) return;

    setActionLoading(true);
    setFeedbackMsg(null);

    try {
      if (newStatus && newStatus !== activeLeadForNote.leadStatus) {
        await api.updateLeadStatus(activeLeadForNote._id, {
          leadStatus: newStatus,
          note: newNote || undefined,
        });
      } else if (newNote) {
        await api.addLeadNote(activeLeadForNote._id, newNote);
      }

      setFeedbackMsg({ type: 'success', text: `Lead for ${activeLeadForNote.name} updated successfully.` });
      setActiveLeadForNote(null);
      setNewNote('');
      setNewStatus('');
      await fetchLeads();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update lead.' });
    } finally {
      setActionLoading(false);
    }
  };

  const getStepBadge = (step: number) => {
    switch (step) {
      case 1:
        return <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">Step 1: Registered</span>;
      case 2:
        return <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">Step 2: BRE Passed</span>;
      case 3:
        return <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">Step 3: Slip Uploaded</span>;
      case 4:
        return <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Step 4: Applied</span>;
      default:
        return <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">Step {step}</span>;
    }
  };

  return (
    <RoleGuard allowedRoles={[UserRole.SALES]}>
      <div className="space-y-6 animate-fade-in">
        {/* Module Header */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">Sales & Lead Tracking Module</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold font-mono">
                  Stage 1: Pre-Application
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Track borrowers who signed up but haven&apos;t finished applying. Follow up to assist through Steps 2-4.
              </p>
            </div>
          </div>

          <div className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
            Active Leads: <strong className="text-blue-400">{leads.length}</strong>
          </div>
        </div>

        {feedbackMsg && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads by name, email, or phone..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-white text-xs outline-none transition"
            />
          </form>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:border-blue-500 outline-none"
            >
              <option value="">All Lead Statuses</option>
              <option value="NEW">NEW</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="DOCUMENT_PENDING">DOCUMENT_PENDING</option>
              <option value="FOLLOW_UP_REQUIRED">FOLLOW_UP_REQUIRED</option>
              <option value="CONVERTED">CONVERTED</option>
              <option value="DROPPED">DROPPED (BRE Failed)</option>
            </select>
          </div>
        </div>

        {/* Leads Table */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading sales leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-2">
            <Users className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Leads Match Criteria</h3>
            <p className="text-xs text-slate-400">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => (
              <div
                key={lead._id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{lead.name}</span>
                      {getStepBadge(lead.currentStep)}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-mono">{lead.email}</span>
                      </span>
                      {lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>{lead.phone}</span>
                        </span>
                      )}
                      <span className="text-slate-500">
                        Registered {new Date(lead.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={lead.leadStatus} size="md" />
                    <button
                      onClick={() => {
                        setActiveLeadForNote(lead);
                        setNewStatus(lead.leadStatus);
                        setNewNote('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Update Lead</span>
                    </button>
                  </div>
                </div>

                {/* Notes Thread */}
                {lead.notes && lead.notes.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Sales Activity & Notes ({lead.notes.length})
                    </div>
                    <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                      {lead.notes.map((n, idx) => (
                        <div key={idx} className="text-xs text-slate-300 flex items-start justify-between gap-2">
                          <span className="leading-relaxed">• {n.note}</span>
                          <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                            {new Date(n.addedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal: Update Lead Status & Add Note */}
        {activeLeadForNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-white text-base">Update Lead: {activeLeadForNote.name}</h3>
                <button
                  onClick={() => setActiveLeadForNote(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateStatusAndNote} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Lead Pipeline Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-white text-xs outline-none"
                  >
                    <option value="NEW">NEW</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="DOCUMENT_PENDING">DOCUMENT_PENDING</option>
                    <option value="FOLLOW_UP_REQUIRED">FOLLOW_UP_REQUIRED</option>
                    <option value="CONVERTED">CONVERTED (Applied)</option>
                    <option value="DROPPED">DROPPED</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Add Sales Follow-up Note</label>
                  <textarea
                    rows={3}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="e.g. Spoke to applicant, explained document requirements..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-white text-xs placeholder:text-slate-600 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveLeadForNote(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
                  >
                    {actionLoading ? 'Saving...' : 'Save Updates'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
