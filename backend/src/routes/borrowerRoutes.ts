import { Router } from 'express';
import {
  checkBREAndSaveDetails,
  uploadSalarySlipController,
  calculateLoanOffer,
  applyForLoan,
  getMyLoans,
  getMyLoanById,
} from '../controllers/borrowerController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rbacMiddleware.js';
import { uploadSalarySlip } from '../middleware/uploadMiddleware.js';
import { UserRole } from '../constants/index.js';

const router = Router();

// All borrower routes require authentication and Borrower (or Admin) role
router.use(authenticate);
router.use(requireRoles(UserRole.BORROWER, UserRole.ADMIN));

// Step 2: Personal Details & BRE verification
router.post('/eligibility', checkBREAndSaveDetails);

// Step 3: Salary Slip Upload
router.post('/upload-slip', uploadSalarySlip.single('salarySlip'), uploadSalarySlipController);

// Step 4: Loan Calculation preview (Live calculator)
router.get('/calculate', calculateLoanOffer);

// Step 4: Submit Application
router.post('/apply', applyForLoan);

// Borrower Loan tracking
router.get('/my-loans', getMyLoans);
router.get('/my-loans/:id', getMyLoanById);

export default router;
