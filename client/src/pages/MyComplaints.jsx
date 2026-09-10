/**
 * client/src/pages/MyComplaints.jsx
 *
 * Displays complaints belonging to the authenticated student only.
 * The backend enforces ownership via req.user._id — this page simply
 * fetches from GET /api/complaints/my and renders the results.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

// Human-readable label + colour for each status value
const STATUS_META = {
  pending:            { label: 'Pending',            colour: '#f59e0b' },
  assigned:           { label: 'Assigned',           colour: '#3b82f6' },
  in_progress:        { label: 'In Progress',        colour: '#8b5cf6' },
  resolved:           { label: 'Resolved',           colour: '#10b981' },
  rejected:           { label: 'Rejected',           colour: '#ef4444' },
  follow_up_required: { label: 'Follow-up Required', colour: '#f97316' },
};

const PRIORITY_META = {
  low:    { label: 'Low',    colour: '#6b7280' },
  medium: { label: 'Medium', colour: '#3b82f6' },
  high:   { label: 'High',   colour: '#f59e0b' },
  urgent: { label: 'Urgent', colour: '#ef4444' },
};

// Format ISO date string to a readable format
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const MyComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await api.get('/complaints/my');
        setComplaints(response.data.complaints);
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to load complaints. Please try again.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">My Complaints</h2>
          <p className="page-subtitle">
            Complaints submitted by {user?.name || 'you'} — newest first
          </p>
        </div>
        <Link to="/complaints/new" className="btn-primary">
          + New Complaint
        </Link>
      </div>

      {loading && <p className="loading-text">Loading your complaints…</p>}
      {error && <div className="form-error">{error}</div>}

      {!loading && !error && complaints.length === 0 && (
        <div className="empty-state">
          <p className="empty-title">No complaints yet</p>
          <p className="empty-sub">
            Use the button above to report a campus issue.
          </p>
        </div>
      )}

      {!loading && complaints.length > 0 && (
        <div className="complaints-list">
          {complaints.map((complaint) => {
            const statusMeta = STATUS_META[complaint.status] || { label: complaint.status, colour: '#6b7280' };
            const priorityMeta = PRIORITY_META[complaint.priority] || { label: complaint.priority, colour: '#6b7280' };

            return (
              <div key={complaint._id} className="complaint-card">
                <div className="complaint-card__top">
                  <h3 className="complaint-card__title">{complaint.title}</h3>
                  <span
                    className="badge-status"
                    style={{ '--badge-colour': statusMeta.colour }}
                  >
                    {statusMeta.label}
                  </span>
                </div>

                <p className="complaint-card__description">{complaint.description}</p>

                <div className="complaint-card__meta">
                  <span className="meta-item">
                    📍 {complaint.location?.name || 'Unknown location'}
                  </span>
                  <span className="meta-item capitalize">{complaint.category}</span>
                  <span
                    className="meta-item"
                    style={{ color: priorityMeta.colour, fontWeight: 600 }}
                  >
                    {priorityMeta.label} priority
                  </span>
                  <span className="meta-item">🗓 {formatDate(complaint.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyComplaints;
