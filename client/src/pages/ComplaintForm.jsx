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

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSubmitError('');
    setSubmitSuccess('');
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

    setLoading(true);
    try {
      // NOTE: No student ID is sent. The backend uses req.user._id from the JWT.
      await api.post('/complaints', {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        location,
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
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComplaintForm;
