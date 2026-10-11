import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { Lead, LeadStatus } from '../models/Lead.js';
import { AuditLog } from '../models/AuditLog.js';

export const getLeads = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search, step } = req.query;

    const query: any = {};
    if (status && Object.values(LeadStatus).includes(status as LeadStatus)) {
      query.leadStatus = status;
    }

    if (step) {
      query.currentStep = Number(step);
    }

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }

    const leads = await Lead.find(query).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: leads.length,
      leads,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leads.',
      error: error.message,
    });
  }
};

export const updateLeadStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { leadStatus, note } = req.body;

    if (!leadStatus || !Object.values(LeadStatus).includes(leadStatus)) {
      res.status(400).json({
        success: false,
        message: 'Valid leadStatus is required.',
      });
      return;
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found.' });
      return;
    }

    lead.leadStatus = leadStatus;
    lead.lastContactedAt = new Date();
    lead.assignedTo = user._id;
    lead.assignedToName = user.name;

    if (note) {
      lead.notes.push({
        note: `[Status -> ${leadStatus}] ${note}`,
        addedBy: user._id,
        addedByName: user.name,
        addedAt: new Date(),
      });
    }

    await lead.save();

    await AuditLog.create({
      action: 'LEAD_STATUS_UPDATED',
      performedBy: user._id,
      performedByName: user.name,
      performedByRole: user.role,
      targetId: lead._id.toString(),
      details: { leadStatus, note },
    });

    res.status(200).json({
      success: true,
      message: `Lead status updated to ${leadStatus}.`,
      lead,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update lead.',
      error: error.message,
    });
  }
};

export const addLeadNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      res.status(400).json({ success: false, message: 'Note content is required.' });
      return;
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found.' });
      return;
    }

    lead.notes.push({
      note: note.trim(),
      addedBy: user._id,
      addedByName: user.name,
      addedAt: new Date(),
    });

    lead.lastContactedAt = new Date();
    await lead.save();

    res.status(200).json({
      success: true,
      message: 'Note added to lead.',
      lead,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to add lead note.',
      error: error.message,
    });
  }
};
