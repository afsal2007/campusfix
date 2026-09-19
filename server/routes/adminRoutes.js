import express from 'express';
import { getDashboardStats, getRecurringIssues } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';


const router = express.Router();

// Admin routes protected by jwt and 'admin' role
router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/recurring-issues', getRecurringIssues);

export default router;
