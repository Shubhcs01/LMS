import { Router } from 'express';
import {
  getAllLoans,
  getSanctionQueue,
  reviewSanction,
  getDisbursementQueue,
  recordDisbursement,
  getCollectionQueue,
  getLoanDetails,
  getDashboardStats,
} from '../controllers/loanController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rbacMiddleware.js';
import { UserRole } from '../constants/index.js';

const router = Router();

// Require authenticated executive or admin
router.use(authenticate);

// Overall Dashboard stats
router.get(
  '/stats',
  requireRoles(
    UserRole.ADMIN,
    UserRole.SALES,
    UserRole.SANCTION,
    UserRole.DISBURSEMENT,
    UserRole.COLLECTION
  ),
  getDashboardStats
);

// All loans (Admin only)
router.get('/', requireRoles(UserRole.ADMIN), getAllLoans);

// Sanction module routes (Sanction and Admin)
router.get('/queue/sanction', requireRoles(UserRole.SANCTION, UserRole.ADMIN), getSanctionQueue);
router.post('/:id/sanction', requireRoles(UserRole.SANCTION, UserRole.ADMIN), reviewSanction);

// Disbursement module routes (Disbursement and Admin)
router.get(
  '/queue/disbursement',
  requireRoles(UserRole.DISBURSEMENT, UserRole.ADMIN),
  getDisbursementQueue
);
router.post(
  '/:id/disburse',
  requireRoles(UserRole.DISBURSEMENT, UserRole.ADMIN),
  recordDisbursement
);

// Collection module loans (Collection and Admin)
router.get('/queue/collection', requireRoles(UserRole.COLLECTION, UserRole.ADMIN), getCollectionQueue);

// Single loan detail (Accessible to all executive roles and Admin)
router.get(
  '/:id',
  requireRoles(
    UserRole.SALES,
    UserRole.SANCTION,
    UserRole.DISBURSEMENT,
    UserRole.COLLECTION,
    UserRole.ADMIN
  ),
  getLoanDetails
);

export default router;
