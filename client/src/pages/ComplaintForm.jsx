/**
 * client/src/pages/ComplaintForm.jsx
 *
 * Student complaint submission form.
 *
 * - Loads campus locations from GET /api/locations on mount.
 * - Submits to POST /api/complaints with the JWT attached automatically.
 * - The backend determines complaint ownership from req.user._id (JWT).
 *   The frontend does NOT send a student ID.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

const CATEGORIES = [
  { value: 'academic', label: 'Academic' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'technical', label: 'Technical' },
  { value: 'cleanliness', label: 'Cleanliness' },
  { value: 'safety', label: 'Safety' },
  { value: 'transport', label: 'Transport' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const ComplaintForm = () => {
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [locationsError, setLocationsError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    location: '',
  });

  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [verificationStatus, setVerificationStatus] = useState('INITIAL'); // INITIAL, LOADING, SUCCESS, FAILURE
  const [verificationData, setVerificationData] = useState(null);
  const [verificationError, setVerificationError] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  // Load campus locations when the component mounts
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await api.get('/locations');
        setLocations(response.data.locations);
      } catch {
        setLocationsError('Failed to load campus locations. Please refresh the page.');
      }
    };

    fetchLocations();
  }, []);

  // Handle location verification
  const handleVerifyLocation = () => {
    setVerificationStatus('LOADING');
    setVerificationError('');

    if (!navigator.geolocation) {
      setVerificationStatus('FAILURE');
      setVerificationError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });

        try {
          const response = await api.verifyLocation(formData.location, latitude, longitude);
          if (response.verified) {
            setVerificationStatus('SUCCESS');
            setVerificationData(response);
          } else {
            setVerificationStatus('FAILURE');
            setVerificationError('You are outside the allowed area.');
            setVerificationData(response);
          }
        } catch (error) {
          setVerificationStatus('FAILURE');
          setVerificationError(error.response?.data?.message || 'Verification failed.');
        }
      },
      (error) => {
        setVerificationStatus('FAILURE');
        let msg = 'Failed to get your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission is required to verify that you are near the selected campus location.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'The request to get user location timed out.';
        }
        setVerificationError(msg);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSubmitError('');
    setSubmitSuccess('');
    if (name === 'location') {
      setVerificationStatus('INITIAL');
      setVerificationData(null);
      setVerificationError('');
      setUserLocation(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    const { title, description, category, priority, location } = formData;

    // Basic frontend validation
    if (!title.trim()) {
      setSubmitError('Please enter a problem title.');
      return;
    }
    if (!description.trim()) {
      setSubmitError('Please describe the problem.');
      return;
    }
    if (!category) {
      setSubmitError('Please select a category.');
      return;
    }
    if (!location) {
      setSubmitError('Please select a location.');
      return;
    }

    if (verificationStatus !== 'SUCCESS' || !userLocation) {
      setSubmitError('Please verify your location first.');
      return;
    }

    setLoading(true);
    try {
      // NOTE: No student ID is sent. The backend uses req.user._id from the JWT.
      await api.post('/complaints', {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        location,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude
      });

      setSubmitSuccess('Complaint submitted successfully!');

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: 'medium',
        location: '',
      });
      setVerificationStatus('INITIAL');
      setVerificationData(null);
      setUserLocation(null);

      // Redirect to My Complaints after a short delay
      setTimeout(() => navigate('/complaints'), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit complaint. Please try again.';
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">Report an Issue</h2>
        <p className="page-subtitle">Fill in the details below to submit a campus complaint.</p>
      </div>

      {locationsError && <div className="form-error">{locationsError}</div>}

      <div className="form-card">
        <form onSubmit={handleSubmit} noValidate>
          {submitError && <div className="form-error">{submitError}</div>}
          {submitSuccess && <div className="form-success">{submitSuccess}</div>}

          {/* Title */}
          <div className="form-group">
            <label htmlFor="complaint-title">Problem Title</label>
            <input
              id="complaint-title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Wi-Fi not working in the lab"
              required
            />
          </div>

          {/* Category + Priority side by side */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="form-group">
            <label htmlFor="location">Location</label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              disabled={locations.length === 0}
            >
              <option value="">
                {locations.length === 0 ? 'Loading locations…' : 'Select location'}
              </option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc._id}>
                  {loc.name}{loc.building !== loc.name ? ` — ${loc.building}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Location Verification Card */}
          {formData.location && (
            <div className={`verification-card ${verificationStatus.toLowerCase()}`}>
              {verificationStatus === 'INITIAL' && (
                <div className="verification-content">
                  <p>Location not verified</p>
                  <button type="button" className="btn-secondary" onClick={handleVerifyLocation}>
                    Verify My Location
                  </button>
                </div>
              )}
              {verificationStatus === 'LOADING' && (
                <div className="verification-content">
                  <p>Checking your location...</p>
                </div>
              )}
              {verificationStatus === 'SUCCESS' && verificationData && (
                <div className="verification-content success">
                  <p><strong>Location verified ✓</strong></p>
                  <p>Distance: {verificationData.distance} m</p>
                  <p>Allowed radius: {verificationData.allowedRadius} m</p>
                </div>
              )}
              {verificationStatus === 'FAILURE' && (
                <div className="verification-content failure">
                  <p><strong>Location verification failed.</strong></p>
                  <p>{verificationError}</p>
                  {verificationData && (
                    <>
                      <p>Distance: {verificationData.distance} m</p>
                      <p>Allowed radius: {verificationData.allowedRadius} m</p>
                    </>
                  )}
                  <button type="button" className="btn-secondary mt-2" onClick={handleVerifyLocation}>
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the issue in detail…"
              rows={5}
              required
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/complaints')}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || verificationStatus !== 'SUCCESS'}>
              {loading ? 'Submitting…' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComplaintForm;
