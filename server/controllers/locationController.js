import Location from '../models/Location.js';
import { calculateDistance } from '../utils/distance.js';

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

/**
 * @desc    Verify student location against campus location
 * @route   POST /api/locations/verify
 * @access  Private
 */
export const verifyLocation = async (req, res) => {
  try {
    const { locationId, latitude, longitude } = req.body;

    if (!locationId) {
      return res.status(400).json({ message: 'Location ID is required' });
    }

    if (latitude === undefined || longitude === undefined || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ message: 'Valid latitude and longitude are required' });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: 'Coordinates are out of bounds' });
    }

    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    const distance = calculateDistance(latitude, longitude, location.latitude, location.longitude);
    const verified = distance <= location.allowedRadius;

    return res.status(200).json({
      verified,
      distance: Math.round(distance),
      allowedRadius: location.allowedRadius,
      location: {
        id: location._id,
        name: location.name,
        building: location.building
      }
    });

  } catch (error) {
    console.error('Error verifying location:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid location ID format' });
    }

    return res.status(500).json({
      message: 'Server error while verifying location',
      error: error.message,
    });
  }
};
