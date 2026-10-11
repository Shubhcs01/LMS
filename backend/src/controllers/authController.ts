import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Lead, LeadStatus } from '../models/Lead.js';
import { AuditLog } from '../models/AuditLog.js';
import { UserRole } from '../constants/index.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

const generateToken = (id: string, email: string, role: string): string => {
  const secret = process.env.JWT_SECRET || 'lms_super_secret_jwt_token_key_secure_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id, email, role }, secret, { expiresIn: expiresIn as any });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
      return;
    }

    // By default, public registration creates a Borrower unless explicitly specified in testing
    const assignedRole = role && Object.values(UserRole).includes(role) ? role : UserRole.BORROWER;

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      phone,
      role: assignedRole,
      applicationStepCompleted: 1,
    });

    // If role is Borrower, initialize a Lead entry for Sales team tracking
    if (assignedRole === UserRole.BORROWER) {
      await Lead.create({
        borrowerId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        currentStep: 1,
        leadStatus: LeadStatus.NEW,
        hasApplied: false,
        notes: [
          {
            note: 'Borrower registered account.',
            addedBy: user._id,
            addedByName: 'System',
            addedAt: new Date(),
          },
        ],
      });
    }

    const token = generateToken(user._id.toString(), user.email, user.role);

    await AuditLog.create({
      action: 'USER_REGISTERED',
      performedBy: user._id,
      performedByName: user.name,
      performedByRole: user.role,
      targetId: user._id.toString(),
      details: { email: user.email, role: user.role },
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        applicationStepCompleted: user.applicationStepCompleted,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Registration failed.',
      error: error.message,
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.',
      });
      return;
    }

    const token = generateToken(user._id.toString(), user.email, user.role);

    await AuditLog.create({
      action: 'USER_LOGIN',
      performedBy: user._id,
      performedByName: user.name,
      performedByRole: user.role,
      targetId: user._id.toString(),
      details: { email: user.email },
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        pan: user.pan,
        dateOfBirth: user.dateOfBirth,
        monthlySalary: user.monthlySalary,
        employmentMode: user.employmentMode,
        applicationStepCompleted: user.applicationStepCompleted,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Login failed.',
      error: error.message,
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        pan: req.user.pan,
        dateOfBirth: req.user.dateOfBirth,
        monthlySalary: req.user.monthlySalary,
        employmentMode: req.user.employmentMode,
        applicationStepCompleted: req.user.applicationStepCompleted,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
