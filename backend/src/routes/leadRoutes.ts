import { Router } from 'express';
import { getLeads, updateLeadStatus, addLeadNote } from '../controllers/leadController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rbacMiddleware.js';
import { UserRole } from '../constants/index.js';

const router = Router();

router.use(authenticate);
router.use(requireRoles(UserRole.SALES, UserRole.ADMIN));

router.get('/', getLeads);
router.patch('/:id/status', updateLeadStatus);
router.post('/:id/notes', addLeadNote);

export default router;
