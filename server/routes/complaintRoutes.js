import express from 'express';
import { createComplaint, getMyComplaints, getComplaintById, getAllComplaints, assignComplaint, updateComplaintStatus, addComplaintAction, addFollowUpAction } from '../controllers/complaintController.js';
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

// PUT /api/complaints/:id/assign — Assign a complaint (faculty, admin only)
router.put('/:id/assign', protect, authorizeRoles('faculty', 'admin'), assignComplaint);

// PUT /api/complaints/:id/status — Update complaint status (faculty, admin only)
router.put('/:id/status', protect, authorizeRoles('faculty', 'admin'), updateComplaintStatus);

// POST /api/complaints/:id/actions — Add a manual action or comment (faculty, admin only)
router.post('/:id/actions', protect, authorizeRoles('faculty', 'admin'), addComplaintAction);

// POST /api/complaints/:id/follow-up — Add a follow-up action (faculty, admin only)
router.post('/:id/follow-up', protect, authorizeRoles('faculty', 'admin'), addFollowUpAction);

export default router;
