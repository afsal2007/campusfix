import Location from '../models/Location.js';

/**
 * @desc    Get all campus locations (sorted alphabetically by name)
 * @route   GET /api/locations
 * @access  Public (read-only — students need this for the complaint form)
 */
export const getLocations = async (req, res) => {
  try {
    const locations = await Location.find({}).sort({ name: 1 });
    return res.status(200).json({ locations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return res.status(500).json({
      message: 'Server error while fetching locations',
      error: error.message,
    });
  }
};
