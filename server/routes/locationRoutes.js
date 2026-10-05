import express from 'express';
import { getLocations, verifyLocation } from '../controllers/locationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/locations — Public read-only endpoint for campus locations
router.get('/', getLocations);

// POST /api/locations/verify — Protected location verification
router.post('/verify', protect, verifyLocation);

export default router;
