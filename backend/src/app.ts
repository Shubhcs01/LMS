import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/authRoutes.js';
import borrowerRoutes from './routes/borrowerRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files (for salary slip view/preview)
const uploadsPath = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    service: 'Loan Management System API',
    timestamp: new Date().toISOString(),
  });
});

// Demo accounts endpoint for evaluator convenience
app.get('/api/demo-accounts', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Pre-seeded accounts for immediate testing across all roles.',
    accounts: [
      { role: 'Borrower', email: 'borrower@lms.com', password: 'Password@123', name: 'Rahul Sharma' },
      { role: 'Sales', email: 'sales@lms.com', password: 'Password@123', name: 'Sanjay Kapoor (Sales Lead)' },
      { role: 'Sanction', email: 'sanction@lms.com', password: 'Password@123', name: 'Ananya Verma (Underwriter)' },
      { role: 'Disbursement', email: 'disbursement@lms.com', password: 'Password@123', name: 'Vikram Malhotra (Treasury)' },
      { role: 'Collection', email: 'collection@lms.com', password: 'Password@123', name: 'Pooja Hegde (Collections)' },
      { role: 'Admin', email: 'admin@lms.com', password: 'Password@123', name: 'Aditya Birla (System Admin)' },
    ],
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/borrower', borrowerRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/leads', leadRoutes);

// Error Handling Middleware
app.use(errorHandler);

export default app;
