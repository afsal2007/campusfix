/**
 * client/src/pages/ComplaintDetails.jsx
 *
 * Displays complete details of a single complaint.
 * Enforces authentication and student ownership via the backend API.
 * Faculty/Admin users see management controls and action history.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  getComplaintById, 
  getFacultyUsers, 
  assignComplaint, 
  updateComplaintStatus, 
  addComplaintAction,
  recordFollowUp
} from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

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
  const { user } = useAuth();
  
  const [complaint, setComplaint] = useState(null);
  const [actionHistory, setActionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusCode, setStatusCode] = useState(null);

  // Faculty Management State
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [actionDesc, setActionDesc] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [followUpComment, setFollowUpComment] = useState('');

  const isFacultyOrAdmin = user && (user.role === 'faculty' || user.role === 'admin');

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getComplaintById(id);
      setComplaint(data.complaint);
      if (data.actionHistory) {
        setActionHistory(data.actionHistory);
      }
      setSelectedFaculty(data.complaint.assignedTo?._id || '');
      setSelectedStatus(data.complaint.status || '');
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

  const fetchFaculty = async () => {
    if (!isFacultyOrAdmin) return;
    try {
      const data = await getFacultyUsers();
      setFacultyList(data.faculty || []);
    } catch (err) {
      console.error('Failed to load faculty list', err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetails();
      fetchFaculty();
    }
    // eslint-disable-next-line
  }, [id, isFacultyOrAdmin]);

  const handleAssign = async () => {
    if (!selectedFaculty) return alert('Please select a faculty member');
    try {
      await assignComplaint(id, selectedFaculty);
      alert('Assigned successfully');
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign complaint');
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return alert('Please select a status');
    try {
      await updateComplaintStatus(id, selectedStatus, statusComment);
      alert('Status updated successfully');
      setStatusComment('');
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAddAction = async () => {
    if (!actionDesc.trim() || !actionComment.trim()) {
      return alert('Both action and comment are required');
    }
    try {
      await addComplaintAction(id, actionDesc, actionComment);
      alert('Action added successfully');
      setActionDesc('');
      setActionComment('');
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add action');
    }
  };

  const handleRecordFollowUp = async () => {
    if (!followUpComment.trim()) {
      return alert('Comment is required for follow-up');
    }
    try {
      await recordFollowUp(id, followUpComment);
      alert('Follow-up recorded successfully');
      setFollowUpComment('');
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record follow-up');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="back-nav">
          <Link to={isFacultyOrAdmin ? "/faculty" : "/complaints"} className="btn-back">
            &larr; Back to {isFacultyOrAdmin ? "Dashboard" : "My Complaints"}
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
          <Link to={isFacultyOrAdmin ? "/faculty" : "/complaints"} className="btn-back">
            &larr; Back to {isFacultyOrAdmin ? "Dashboard" : "My Complaints"}
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
          <Link to={isFacultyOrAdmin ? "/faculty" : "/complaints"} className="btn-primary" style={{ marginTop: '1rem' }}>
            Return to {isFacultyOrAdmin ? "Dashboard" : "My Complaints"}
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

  // Compute days open
  const msOpen = new Date().getTime() - new Date(complaint.createdAt).getTime();
  const daysOpen = Math.floor(msOpen / (1000 * 60 * 60 * 24));
  const isUnresolved = !['resolved', 'rejected'].includes(complaint.status);
  const followUpRequired = isUnresolved && daysOpen >= 30;

  return (
    <div className="page-container">
      <div className="back-nav">
        <Link to={isFacultyOrAdmin ? "/faculty" : "/complaints"} className="btn-back">
          &larr; Back to {isFacultyOrAdmin ? "Dashboard" : "My Complaints"}
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
            {followUpRequired && (
              <span className="priority-badge priority-urgent" style={{ marginLeft: '0.5rem', fontWeight: 'bold' }}>
                ⚠️ Follow-up Required
              </span>
            )}
          </div>
        </div>

        <h1 className="details-title">{complaint.title}</h1>
        <p className="details-id-text">Complaint ID: {complaint._id}</p>
        
        <div style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>
          <strong>Days Open:</strong> {daysOpen}
        </div>
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

          {/* Action History (For all users if populated, but heavily for faculty) */}
          {actionHistory.length > 0 && (
            <div className="details-section-card">
              <h2 className="section-title">Action History</h2>
              <div className="action-history-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {actionHistory.map((act) => (
                  <div key={act._id} style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#1e293b' }}>{act.action}</strong>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{formatDate(act.createdAt)}</span>
                    </div>
                    {act.comment && <p style={{ margin: '0 0 0.5rem 0', color: '#334155' }}>{act.comment}</p>}
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      By: {act.performedBy?.name || 'Unknown'} ({act.performedBy?.role || 'user'})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Faculty Management Section */}
          {isFacultyOrAdmin && (
            <div className="details-section-card" style={{ border: '2px solid #e2e8f0', background: '#f8fafc' }}>
              <h2 className="section-title">Faculty Management Controls</h2>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Assign To Faculty</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select 
                    value={selectedFaculty} 
                    onChange={e => setSelectedFaculty(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">Select Faculty...</option>
                    {facultyList.map(f => (
                      <option key={f._id} value={f._id}>{f.name} ({f.department})</option>
                    ))}
                  </select>
                  <button className="btn-primary" onClick={handleAssign}>Assign</button>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Update Status</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <select 
                    value={selectedStatus} 
                    onChange={e => setSelectedStatus(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="rejected">Rejected</option>
                    <option value="follow_up_required">Follow Up Required</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    placeholder="Optional comment on status change" 
                    value={statusComment}
                    onChange={e => setStatusComment(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  />
                  <button className="btn-primary" onClick={handleStatusUpdate}>Update Status</button>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Add Manual Action / Comment</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    placeholder="Action description (e.g., 'Inspected site')" 
                    value={actionDesc}
                    onChange={e => setActionDesc(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  />
                  <textarea 
                    placeholder="Detailed comment" 
                    value={actionComment}
                    onChange={e => setActionComment(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', minHeight: '80px' }}
                  ></textarea>
                  <button className="btn-primary" onClick={handleAddAction} style={{ alignSelf: 'flex-start' }}>Add Action</button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Record Follow-up</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <textarea 
                    placeholder="Follow-up comment (e.g., 'Checked with maintenance, parts delayed')" 
                    value={followUpComment}
                    onChange={e => setFollowUpComment(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', minHeight: '80px' }}
                  ></textarea>
                  <button className="btn-secondary" onClick={handleRecordFollowUp} style={{ alignSelf: 'flex-start' }}>Record Follow-up</button>
                </div>
              </div>

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
          {/* Assigned Info */}
          <div className="details-section-card">
            <h2 className="section-title">Assigned To</h2>
            <div className="sidebar-info-group">
              <span className="sidebar-icon">👤</span>
              <div>
                <p className="sidebar-primary-text">
                  {complaint.assignedTo?.name || 'Unassigned'}
                </p>
                {complaint.assignedTo?.department && (
                  <p className="sidebar-secondary-text">
                    Dept: {complaint.assignedTo.department}
                  </p>
                )}
              </div>
            </div>
          </div>

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
