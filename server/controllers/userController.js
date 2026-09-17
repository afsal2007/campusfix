import User from '../models/User.js';

/**
 * @desc    Get all faculty users
 * @route   GET /api/users/faculty
 * @access  Private (faculty, admin)
 */
export const getFacultyUsers = async (req, res) => {
  try {
    const faculty = await User.find({ role: 'faculty' })
      .select('_id name email department')
      .sort({ name: 1 }); // Sort by name ascending

    return res.status(200).json({ faculty });
  } catch (error) {
    console.error('Error fetching faculty users:', error);
    return res.status(500).json({
      message: 'Server error while fetching faculty users',
      error: error.message,
    });
  }
};
