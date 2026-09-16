import express from 'express';
import { createComplaint, getMyComplaints, getComplaintById, getAllComplaints } from '../controllers/complaintController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// POST /api/complaints — Create a new complaint (protected)
router.post('/', protect, createComplaint);

// GET /api/complaints/my — Get complaints for the logged-in student (protected)
router.get('/my', protect, getMyComplaints);

// GET /api/complaints — Get all complaints (faculty, admin only)
router.get('/', protect, authorizeRoles('faculty', 'admin'), getAllComplaints);

// GET /api/complaints/:id — Get details of a single complaint by ID (protected)
router.get('/:id', protect, getComplaintById);

export default router;

