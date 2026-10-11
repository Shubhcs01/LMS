import { Router } from 'express';
import { recordPayment, getLoanPayments } from '../controllers/paymentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rbacMiddleware.js';
import { UserRole } from '../constants/index.js';

const router = Router();

router.use(authenticate);

// Record a new payment (Collection Executive or Admin)
router.post(
  '/',
  requireRoles(UserRole.COLLECTION, UserRole.ADMIN),
  recordPayment
);

// Get payments for a loan
router.get(
  '/loan/:loanId',
  requireRoles(
    UserRole.COLLECTION,
    UserRole.ADMIN,
    UserRole.DISBURSEMENT,
    UserRole.SANCTION,
    UserRole.BORROWER
  ),
  getLoanPayments
);

export default router;
