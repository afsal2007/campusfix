/**
 * client/src/pages/MyComplaints.jsx
 *
 * Displays complaints belonging to the authenticated student only.
 * The backend enforces ownership via req.user._id — this page simply
 * fetches from GET /api/complaints/my and renders the results.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getStoredUser } from '../services/api.js';
import db from '../db/database.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { syncPendingComplaints } from '../services/syncService.js';

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
  const [localComplaints, setLocalComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      if (navigator.onLine) {
        const response = await api.get('/complaints/my');
        setComplaints(response.data.complaints);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load complaints from server.';
      setError(msg);
    } finally {
      setLoading(false);
    }

    // Load local complaints
    try {
      const user = getStoredUser();
      const studentId = user?._id || user?.id;
      if (studentId) {
        const locals = await db.pendingComplaints.where({ studentId }).toArray();
        setLocalComplaints(locals);
      }
    } catch (err) {
      console.error('Failed to load local complaints', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncMessage('Syncing...');
    try {
      await syncPendingComplaints();
      setSyncMessage('Sync completed.');
      loadData(); // refresh list
    } catch (err) {
      setSyncMessage('Some complaints could not be synced.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(''), 3000);
    }
  };

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

      {!loading && !error && complaints.length === 0 && localComplaints.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p className="empty-title">No complaints yet</p>
          <p className="empty-sub">
            You haven't submitted any complaints yet. Use the button above to report a campus issue.
          </p>
          <Link to="/complaints/new" className="btn-primary" style={{ marginTop: '1rem' }}>
            Report an Issue
          </Link>
        </div>
      )}

      {localComplaints.length > 0 && (
        <div className="local-sync-section" style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontWeight: 500 }}>
              You have {localComplaints.length} pending offline complaint(s).
            </p>
            <div>
              <button 
                onClick={handleSyncNow} 
                disabled={syncing || !navigator.onLine}
                className="btn-primary"
                style={{ padding: '0.5rem 1rem' }}
              >
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>
          {syncMessage && <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#16a34a' }}>{syncMessage}</p>}
        </div>
      )}

      {!loading && (complaints.length > 0 || localComplaints.length > 0) && (
        <div className="complaints-list">
          {/* Render local complaints first */}
          {localComplaints.map((complaint) => {
            const priorityMeta = PRIORITY_META[complaint.priority] || { label: complaint.priority, colour: '#6b7280' };
            const isSyncing = syncing;
            let statusLabel = 'Waiting for connection';
            if (navigator.onLine) statusLabel = 'Pending sync';
            if (isSyncing) statusLabel = 'Syncing...';
            if (complaint.syncStatus === 'failed') statusLabel = 'Sync failed';
            
            const statusColor = complaint.syncStatus === 'failed' ? '#ef4444' : '#f59e0b';
            
            return (
              <div key={complaint.clientRequestId} className="complaint-card" style={{ borderLeft: `4px solid ${statusColor}` }}>
                <div className="complaint-card__top">
                  <h3 className="complaint-card__title">{complaint.title}</h3>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '9999px', background: statusColor, color: 'white' }}>
                    {statusLabel}
                  </span>
                </div>
                <p className="complaint-card__description">{complaint.description}</p>
                {complaint.lastSyncError && (
                  <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>Error: {complaint.lastSyncError}</p>
                )}
                <div className="complaint-card__meta">
                  <span className="meta-item capitalize">{complaint.category}</span>
                  <span className="meta-item" style={{ color: priorityMeta.colour, fontWeight: 600 }}>{priorityMeta.label} priority</span>
                  <span className="meta-item">🗓 {formatDate(complaint.createdAt)}</span>
                </div>
              </div>
            );
          })}

          {/* Render synced complaints */}
          {complaints.map((complaint) => {
            const priorityMeta = PRIORITY_META[complaint.priority] || { label: complaint.priority, colour: '#6b7280' };

            return (
              <Link
                to={`/complaints/${complaint._id}`}
                key={complaint._id}
                className="complaint-card complaint-card--link"
              >
                <div className="complaint-card__top">
                  <h3 className="complaint-card__title">{complaint.title}</h3>
                  <StatusBadge status={complaint.status} />
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
                  <span className="meta-item click-hint">View details &rarr;</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyComplaints;

