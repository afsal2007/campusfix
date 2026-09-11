/**
 * client/src/pages/ComplaintDetails.jsx
 *
 * Displays complete details of a single complaint.
 * Enforces authentication and student ownership via the backend API.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getComplaintById } from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';

const PRIORITY_META = {
  low: { label: 'Low', colour: '#6b7280', bg: '#f3f4f6' },
  medium: { label: 'Medium', colour: '#2563eb', bg: '#dbeafe' },
  high: { label: 'High', colour: '#d97706', bg: '#fef3c7' },
  urgent: { label: 'Urgent', colour: '#dc2626', bg: '#fee2e2' },
};

const formatDate = (isoString) => {
  if (!isoString) return null;
  return new Date(isoString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ComplaintDetails = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusCode, setStatusCode] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getComplaintById(id);
        setComplaint(data.complaint);
      } catch (err) {
        const status = err.response?.status;
        setStatusCode(status);
        if (status === 401) {
          setError('Authentication expired. Please log in again.');
        } else if (status === 403) {
          setError('Access denied. You can only view your own complaints.');
        } else if (status === 404) {
          setError('Complaint not found or may have been removed.');
        } else {
          setError(
            err.response?.data?.message || 'Failed to load complaint details. Please try again.'
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="back-nav">
          <Link to="/complaints" className="btn-back">
            &larr; Back to My Complaints
          </Link>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading complaint details…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="back-nav">
          <Link to="/complaints" className="btn-back">
            &larr; Back to My Complaints
          </Link>
        </div>
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <h3 className="error-title">
            {statusCode === 403
              ? 'Access Forbidden'
              : statusCode === 404
              ? 'Not Found'
              : 'Error'}
          </h3>
          <p className="error-message">{error}</p>
          <Link to="/complaints" className="btn-primary" style={{ marginTop: '1rem' }}>
            Return to My Complaints
          </Link>
        </div>
      </div>
    );
  }

  if (!complaint) return null;

  const priorityMeta = PRIORITY_META[complaint.priority] || {
    label: complaint.priority,
    colour: '#6b7280',
    bg: '#f3f4f6',
  };

  // Build timeline events using real available data ONLY
  const timelineEvents = [];

  // Event 1: Submitted
  if (complaint.createdAt) {
    timelineEvents.push({
      key: 'created',
      title: 'Complaint Submitted',
      status: 'pending',
      date: formatDate(complaint.createdAt),
      description: 'Submitted and assigned pending status for review.',
      isCompleted: true,
    });
  }

  // Event 2: Updated (if status has progressed or updatedAt is significantly after createdAt)
  const isUpdatedLater =
    complaint.updatedAt &&
    complaint.createdAt &&
    new Date(complaint.updatedAt).getTime() - new Date(complaint.createdAt).getTime() > 1000;

  if (isUpdatedLater || complaint.status !== 'pending') {
    timelineEvents.push({
      key: 'current_status',
      title: `Current Status: ${complaint.status.replace(/_/g, ' ')}`,
      status: complaint.status,
      date: isUpdatedLater ? formatDate(complaint.updatedAt) : null,
      description: `Status updated to ${complaint.status.replace(/_/g, ' ')}.`,
      isCompleted: complaint.status === 'resolved' || complaint.status === 'closed',
      isCurrent: complaint.status !== 'resolved' && complaint.status !== 'closed',
    });
  }

  // Event 3: Resolved (if resolvedAt date exists)
  if (complaint.resolvedAt) {
    timelineEvents.push({
      key: 'resolved',
      title: 'Complaint Resolved',
      status: 'resolved',
      date: formatDate(complaint.resolvedAt),
      description: complaint.resolution || 'Issue has been successfully resolved.',
      isCompleted: true,
    });
  }

  const hasActionOrResolution = complaint.actionTaken || complaint.resolution;

  return (
    <div className="page-container">
      <div className="back-nav">
        <Link to="/complaints" className="btn-back">
          &larr; Back to My Complaints
        </Link>
      </div>

      <div className="details-header-card">
        <div className="details-header-top">
          <span className="details-category-tag">{complaint.category}</span>
          <div className="details-header-badges">
            <span
              className="priority-badge"
              style={{
                color: priorityMeta.colour,
                backgroundColor: priorityMeta.bg,
                border: `1px solid ${priorityMeta.colour}40`,
              }}
            >
              {priorityMeta.label} Priority
            </span>
            <StatusBadge status={complaint.status} />
          </div>
        </div>

        <h1 className="details-title">{complaint.title}</h1>
        <p className="details-id-text">Complaint ID: {complaint._id}</p>
      </div>

      <div className="details-grid">
        {/* Main Content Column */}
        <div className="details-main">
          {/* Description Section */}
          <div className="details-section-card">
            <h2 className="section-title">Description</h2>
            <p className="details-description">{complaint.description}</p>
          </div>

          {/* Action Taken & Resolution Section (Shown ONLY when populated) */}
          {hasActionOrResolution && (
            <div className="details-section-card resolution-card">
              <h2 className="section-title">Resolution & Action Info</h2>

              {complaint.actionTaken && (
                <div className="info-block">
                  <h4 className="info-subtitle">Action Taken:</h4>
                  <p className="info-text">{complaint.actionTaken}</p>
                </div>
              )}

              {complaint.resolution && (
                <div className="info-block">
                  <h4 className="info-subtitle">Resolution Summary:</h4>
                  <p className="info-text">{complaint.resolution}</p>
                </div>
              )}
            </div>
          )}

          {/* Basic Status Timeline */}
          <div className="details-section-card">
            <h2 className="section-title">Status Timeline</h2>
            <div className="timeline">
              {timelineEvents.map((evt, idx) => (
                <div
                  key={evt.key || idx}
                  className={`timeline-item ${evt.isCompleted ? 'completed' : ''} ${
                    evt.isCurrent ? 'current' : ''
                  }`}
                >
                  <div className="timeline-marker">
                    <span className="timeline-dot"></span>
                    {idx < timelineEvents.length - 1 && <span className="timeline-line"></span>}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <h3 className="timeline-title">{evt.title}</h3>
                      {evt.date && <span className="timeline-date">{evt.date}</span>}
                    </div>
                    {evt.description && (
                      <p className="timeline-description">{evt.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Info Column */}
        <div className="details-sidebar">
          {/* Location Info */}
          <div className="details-section-card">
            <h2 className="section-title">Location</h2>
            <div className="sidebar-info-group">
              <span className="sidebar-icon">📍</span>
              <div>
                <p className="sidebar-primary-text">
                  {complaint.location?.name || 'Unspecified Location'}
                </p>
                {complaint.location?.building && (
                  <p className="sidebar-secondary-text">
                    Building: {complaint.location.building}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Dates & Timestamps */}
          <div className="details-section-card">
            <h2 className="section-title">Timeline Dates</h2>
            <ul className="dates-list">
              <li>
                <span className="date-label">Submitted:</span>
                <span className="date-value">{formatDate(complaint.createdAt) || '—'}</span>
              </li>
              <li>
                <span className="date-label">Last Updated:</span>
                <span className="date-value">{formatDate(complaint.updatedAt) || '—'}</span>
              </li>
              {complaint.resolvedAt && (
                <li>
                  <span className="date-label">Resolved:</span>
                  <span className="date-value">{formatDate(complaint.resolvedAt)}</span>
                </li>
              )}
              {complaint.followUpDate && (
                <li>
                  <span className="date-label">Follow-up Scheduled:</span>
                  <span className="date-value">{formatDate(complaint.followUpDate)}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Student Info */}
          {complaint.student && (
            <div className="details-section-card">
              <h2 className="section-title">Submitted By</h2>
              <div className="student-info-card">
                <p className="student-name">{complaint.student.name}</p>
                <p className="student-detail">Reg #: {complaint.student.registerNumber}</p>
                <p className="student-detail">
                  {complaint.student.department} &bull; Year {complaint.student.year} ({complaint.student.className})
                </p>
                {complaint.student.email && (
                  <p className="student-detail email">{complaint.student.email}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetails;
