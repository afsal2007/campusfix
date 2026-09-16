import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';
import Location from '../models/Location.js';

// Valid values (mirrors the schema enums)
const VALID_CATEGORIES = [
  'academic',
  'infrastructure',
  'technical',
  'cleanliness',
  'safety',
  'transport',
  'hostel',
  'other',
];

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

/**
 * @desc    Create a new complaint
 * @route   POST /api/complaints
 * @access  Private (student, faculty, admin)
 *
 * SECURITY: The student field is ALWAYS set from req.user._id.
 * Any student field in the request body is ignored.
 */
export const createComplaint = async (req, res) => {
  try {
    const { location, title, description, category, priority } = req.body;

    // --- Validate required fields ---
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Description is required' });
    }

    if (!location) {
      return res.status(400).json({ message: 'Location is required' });
    }

    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }

    // --- Validate category ---
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      });
    }

    // --- Validate priority (optional, defaults to 'medium') ---
    const chosenPriority = priority || 'medium';
    if (!VALID_PRIORITIES.includes(chosenPriority)) {
      return res.status(400).json({
        message: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`,
      });
    }

    // --- Validate location exists in the database ---
    const locationDoc = await Location.findById(location);
    if (!locationDoc) {
      return res.status(404).json({
        message: 'Location not found. Please select a valid campus location.',
      });
    }

    // --- Create complaint — student always comes from the JWT ---
    const complaint = await Complaint.create({
      student: req.user._id,   // SECURITY: Never from req.body
      location: locationDoc._id,
      title: title.trim(),
      description: description.trim(),
      category,
      priority: chosenPriority,
      status: 'pending',        // Always starts as pending
    });

    return res.status(201).json({
      message: 'Complaint created successfully',
      complaint,
    });
  } catch (error) {
    console.error('Error creating complaint:', error);

    // Handle invalid ObjectId format for location
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid location ID format' });
    }

    return res.status(500).json({
      message: 'Server error while creating complaint',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all complaints belonging to the authenticated student
 * @route   GET /api/complaints/my
 * @access  Private
 *
 * SECURITY: Only returns complaints where student === req.user._id
 */
export const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ student: req.user._id })
      .populate('student', 'name registerNumber department year className')
      .populate('location', 'name building')
      .sort({ createdAt: -1 }); // Newest first

    return res.status(200).json({ complaints });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return res.status(500).json({
      message: 'Server error while fetching complaints',
      error: error.message,
    });
  }
};

/**
 * @desc    Get a single complaint by ID
 * @route   GET /api/complaints/:id
 * @access  Private
 *
 * SECURITY:
 * 1. Requires valid authentication (protect middleware).
 * 2. Students can only retrieve their own complaints.
 * 3. Never trust client-supplied studentId.
 */
export const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const complaint = await Complaint.findById(id)
      .populate('student', 'name registerNumber department year className email')
      .populate('location', 'name building latitude longitude')
      .populate('assignedTo', 'name email department');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Security check: verify ownership for student role
    const studentOwnerId = complaint.student?._id
      ? complaint.student._id.toString()
      : complaint.student?.toString();

    const requestUserId = req.user._id.toString();

    // If the requester is a student and is not the complaint owner, deny access
    if (req.user.role === 'student' && studentOwnerId !== requestUserId) {
      return res.status(403).json({
        message: 'Access denied. You can only view your own complaints.',
      });
    }

    return res.status(200).json({ complaint });
  } catch (error) {
    console.error('Error fetching complaint details:', error);

    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    return res.status(500).json({
      message: 'Server error while fetching complaint details',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all complaints
 * @route   GET /api/complaints
 * @access  Private (faculty, admin)
 */
export const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({})
      .populate('student', 'name registerNumber department year className')
      .populate('location', 'name building')
      .sort({ createdAt: -1 });

    return res.status(200).json({ complaints });
  } catch (error) {
    console.error('Error fetching all complaints:', error);
    return res.status(500).json({
      message: 'Server error while fetching all complaints',
      error: error.message,
    });
  }
};

