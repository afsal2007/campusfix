import express from 'express';
import { getFacultyUsers } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// GET /api/users/faculty — Get list of faculty users (faculty, admin only)
router.get('/faculty', protect, authorizeRoles('faculty', 'admin'), getFacultyUsers);

export default router;
