import express from 'express';
import { createComplaint, getMyComplaints } from '../controllers/complaintController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/complaints — Create a new complaint (protected)
router.post('/', protect, createComplaint);

// GET /api/complaints/my — Get complaints for the logged-in student (protected)
router.get('/my', protect, getMyComplaints);

export default router;
