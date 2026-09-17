/**
 * client/src/pages/FacultyDashboard.jsx
 *
 * Faculty/Admin Dashboard - Day 6
 *
 * Displays:
 *  - Summary metric cards (Total, Pending, Assigned, In Progress, Resolved)
 *  - Recent complaints list with student and location details
 *
 * Access: faculty and admin only.
 * 
 * Auth: uses getAllComplaints() which attaches JWT automatically via interceptor.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllComplaints } from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';

// -- Priority badge config ---------------------------------------------------

const PRIORITY_CFG = {
  low:    { label: 'Low',    colour: '#6b7280', bg: '#f3f4f6' },
  medium: { label: 'Medium', colour: '#2563eb', bg: '#dbeafe' },
  high:   { label: 'High',   colour: '#d97706', bg: '#fef3c7' },
  urgent: { label: 'Urgent', colour: '#dc2626', bg: '#fee2e2' },
};

const PriorityBadge = ({ priority }) => {
  const key = (priority || '').toLowerCase();
  const cfg = PRIORITY_CFG[key] || { label: priority || 'Unknown', colour: '#6b7280', bg: '#f3f4f6' };
  return (
    React.createElement('span', {
      style: {
        display: 'inline-block',
        padding: '0.2rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.8rem',
        fontWeight: '600',
        color: cfg.colour,
        backgroundColor: cfg.bg,
        border: '1px solid ' + cfg.colour + '40',
        textTransform: 'capitalize',
      }
    }, cfg.label)
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// -- Summary card ------------------------------------------------------------

const SummaryCard = ({ label, count, accent, icon }) =>
  React.createElement('div', {
    className: 'fac-summary-card',
    style: { borderTop: '3px solid ' + accent },
  },
    React.createElement('span', { className: 'fac-summary-card__icon' }, icon),
    React.createElement('div', { className: 'fac-summary-card__count', style: { color: accent } }, count),
    React.createElement('div', { className: 'fac-summary-card__label' }, label)
  );

// -- Main component ----------------------------------------------------------

const FacultyDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllComplaints();
        setComplaints(data.complaints || []);
      } catch (err) {
        console.error('Failed to load complaints:', err);
        setError(
          err?.response?.data?.message || 'Failed to load complaints. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const total      = complaints.length;
  const pending    = complaints.filter((c) => c.status === 'pending').length;
  const assigned   = complaints.filter((c) => c.status === 'assigned').length;
  const inProgress = complaints.filter((c) => c.status === 'in_progress').length;
  const resolved   = complaints.filter((c) => c.status === 'resolved').length;

  if (loading) {
    return (
      <div className="fac-dashboard">
        <div className="fac-header">
          <h1 className="fac-header__title">Faculty Dashboard</h1>
          <p className="fac-header__subtitle">Campus Complaint Overview</p>
        </div>
        <div className="fac-state-container">
          <div className="fac-loading-spinner" aria-label="Loading" />
          <p className="fac-state-text">Loading complaints...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fac-dashboard">
        <div className="fac-header">
          <h1 className="fac-header__title">Faculty Dashboard</h1>
          <p className="fac-header__subtitle">Campus Complaint Overview</p>
        </div>
        <div className="fac-state-container fac-state-container--error">
          <span className="fac-state-icon" role="img" aria-label="Warning">Warning</span>
          <p className="fac-state-text">{error}</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fac-dashboard">
      <div className="fac-header">
        <h1 className="fac-header__title">Faculty Dashboard</h1>
        <p className="fac-header__subtitle">
          Campus Complaint Overview &mdash; {total} complaint{total !== 1 ? 's' : ''}
        </p>
      </div>

      <section className="fac-summary-grid" aria-label="Complaint summary">
        <SummaryCard label="Total"       count={total}      accent="#6366f1" icon="All" />
        <SummaryCard label="Pending"     count={pending}    accent="#f59e0b" icon="Pending" />
        <SummaryCard label="Assigned"    count={assigned}   accent="#2563eb" icon="Assigned" />
        <SummaryCard label="In Progress" count={inProgress} accent="#7c3aed" icon="Active" />
        <SummaryCard label="Resolved"    count={resolved}   accent="#059669" icon="Done" />
      </section>

      <section className="fac-complaints-section">
        <h2 className="fac-section-title">Recent Complaints</h2>

        {complaints.length === 0 ? (
          <div className="fac-state-container">
            <p className="fac-state-text">No complaints have been submitted yet.</p>
          </div>
        ) : (
          <div className="fac-complaints-list">
            {complaints.map((complaint) => {
              const student  = complaint.student  || {};
              const location = complaint.location || {};
              return (
                <Link
                  to={`/complaints/${complaint._id}`}
                  key={complaint._id}
                  className="fac-complaint-card"
                  aria-label={'Complaint: ' + complaint.title}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  <div className="fac-complaint-card__header">
                    <h3 className="fac-complaint-card__title">{complaint.title}</h3>
                    <StatusBadge status={complaint.status} />
                  </div>

                  <div className="fac-complaint-card__meta">
                    <span className="fac-meta-tag fac-meta-tag--category">
                      {complaint.category}
                    </span>
                    <PriorityBadge priority={complaint.priority} />
                  </div>

                  <div className="fac-complaint-card__details">
                    <div className="fac-detail-item">
                      <span className="fac-detail-item__label">Location</span>
                      <span className="fac-detail-item__value">
                        {location.name
                          ? location.name + (location.building ? ' - ' + location.building : '')
                          : '-'}
                      </span>
                    </div>
                    <div className="fac-detail-item">
                      <span className="fac-detail-item__label">Student</span>
                      <span className="fac-detail-item__value">{student.name || '-'}</span>
                    </div>
                    <div className="fac-detail-item">
                      <span className="fac-detail-item__label">Reg. No.</span>
                      <span className="fac-detail-item__value">{student.registerNumber || '-'}</span>
                    </div>
                    <div className="fac-detail-item">
                      <span className="fac-detail-item__label">Department</span>
                      <span className="fac-detail-item__value">{student.department || '-'}</span>
                    </div>
                    <div className="fac-detail-item">
                      <span className="fac-detail-item__label">Submitted</span>
                      <span className="fac-detail-item__value">{formatDate(complaint.createdAt)}</span>
                    </div>
                    <div className="fac-detail-item">
                      <span className="fac-detail-item__label">Assigned</span>
                      <span className="fac-detail-item__value">
                        {complaint.assignedTo ? complaint.assignedTo.name : 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default FacultyDashboard;
