import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDashboard, getRecurringIssues, getFollowUpComplaints } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recurring, setRecurring] = useState([]);
  const [followUpComplaints, setFollowUpComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const [dashboardData, recurringData, followUpData] = await Promise.all([
        getAdminDashboard(),
        getRecurringIssues(),
        getFollowUpComplaints()
      ]);
      setStats(dashboardData);
      setRecurring(recurringData);
      setFollowUpComplaints(followUpData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container dashboard-container">
        <h2>Admin Dashboard</h2>
        <div className="loading">Loading dashboard statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container dashboard-container">
        <h2>Admin Dashboard</h2>
        <div className="error-message">{error}</div>
        <button className="btn-primary" onClick={fetchDashboardData}>Retry</button>
      </div>
    );
  }

  if (!stats) return null;

  const { summary, byCategory, byLocation, unresolvedComplaintsList } = stats;

  return (
    <div className="container dashboard-container admin-dashboard">
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <p>System Overview & Recurring Issue Monitoring</p>
      </div>

      {/* Summary Cards */}
      <section className="admin-section">
        <h3>Overview</h3>
        <div className="admin-summary-grid">
          <div className="admin-summary-card">
            <h4>Total</h4>
            <div className="admin-stat">{summary.totalComplaints}</div>
          </div>
          <div className="admin-summary-card">
            <h4>Pending</h4>
            <div className="admin-stat">{summary.pendingComplaints}</div>
          </div>
          <div className="admin-summary-card">
            <h4>Assigned</h4>
            <div className="admin-stat">{summary.assignedComplaints}</div>
          </div>
          <div className="admin-summary-card">
            <h4>In Progress</h4>
            <div className="admin-stat">{summary.inProgressComplaints}</div>
          </div>
          <div className="admin-summary-card">
            <h4>Resolved</h4>
            <div className="admin-stat text-success">{summary.resolvedComplaints}</div>
          </div>
          <div className="admin-summary-card">
            <h4>Unresolved</h4>
            <div className="admin-stat text-danger">{summary.unresolvedComplaints}</div>
          </div>
        </div>
      </section>

      <div className="admin-grid-2-col">
        {/* Category Stats */}
        <section className="admin-section">
          <h3>By Category</h3>
          {byCategory.length === 0 ? (
            <p className="empty-state">No data available.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {byCategory.map((cat) => (
                    <tr key={cat.category}>
                      <td className="capitalize">{cat.category}</td>
                      <td>{cat.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Location Stats */}
        <section className="admin-section">
          <h3>By Location</h3>
          {byLocation.length === 0 ? (
            <p className="empty-state">No data available.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {byLocation.map((loc) => (
                    <tr key={loc.locationId || 'unknown'}>
                      <td>
                        {loc.locationName}
                        <div className="text-sm text-muted">{loc.building}</div>
                      </td>
                      <td>{loc.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Recurring Issues */}
      <section className="admin-section">
        <h3>Recurring Issues</h3>
        {recurring.length === 0 ? (
          <p className="empty-state">No recurring issues detected.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Category</th>
                  <th>Total Complaints</th>
                  <th>Unresolved</th>
                  <th>Frequency Level</th>
                  <th>Latest Report</th>
                </tr>
              </thead>
              <tbody>
                {recurring.map((issue, idx) => (
                  <tr key={idx}>
                    <td>
                      {issue.location.name}
                      <div className="text-sm text-muted">{issue.location.building}</div>
                    </td>
                    <td className="capitalize">{issue.category}</td>
                    <td>{issue.complaintCount}</td>
                    <td>
                      <span className={issue.unresolvedCount > 0 ? 'text-danger fw-bold' : ''}>
                        {issue.unresolvedCount}
                      </span>
                    </td>
                    <td>
                      <span className={`freq-badge freq-${issue.frequencyLevel}`}>
                        {issue.frequencyLevel}
                      </span>
                    </td>
                    <td>{new Date(issue.latestComplaintDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Unresolved Complaints List */}
      <section className="admin-section">
        <h3>Long-Pending Unresolved Complaints</h3>
        {unresolvedComplaintsList.length === 0 ? (
          <p className="empty-state">All caught up! No unresolved complaints.</p>
        ) : (
          <div className="admin-complaints-list">
            {unresolvedComplaintsList.map((complaint) => (
              <div key={complaint._id} className="admin-complaint-card">
                <div className="admin-complaint-header">
                  <h4>
                    <Link to={`/complaints/${complaint._id}`}>{complaint.title}</Link>
                  </h4>
                  <StatusBadge status={complaint.status} />
                </div>
                <div className="admin-complaint-details">
                  <div className="detail-item">
                    <span className="label">Category:</span>
                    <span className="capitalize">{complaint.category}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Priority:</span>
                    <span className={`priority-badge priority-${complaint.priority}`}>
                      {complaint.priority}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Location:</span>
                    <span>
                      {complaint.location
                        ? `${complaint.location.name} (${complaint.location.building})`
                        : 'Unknown'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Student:</span>
                    <span>{complaint.student?.name || 'Unknown'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Assigned To:</span>
                    <span>{complaint.assignedTo ? complaint.assignedTo.name : 'Unassigned'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Reported:</span>
                    <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="admin-complaint-actions">
                  <Link to={`/complaints/${complaint._id}`} className="btn-secondary btn-sm">
                    Manage Complaint
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Follow-up Required */}
      <section className="admin-section">
        <h3>Follow-up Required (30+ Days Unresolved)</h3>
        {followUpComplaints.length === 0 ? (
          <p className="empty-state">No complaints currently require follow-up.</p>
        ) : (
          <div className="admin-complaints-list">
            {followUpComplaints.map((complaint) => (
              <div key={complaint._id} className="admin-complaint-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div className="admin-complaint-header">
                  <h4>
                    <Link to={`/complaints/${complaint._id}`}>{complaint.title}</Link>
                  </h4>
                  <StatusBadge status={complaint.status} />
                </div>
                <div className="admin-complaint-details">
                  <div className="detail-item">
                    <span className="label" style={{color: '#d97706', fontWeight: 'bold'}}>Days Open:</span>
                    <span style={{color: '#d97706', fontWeight: 'bold'}}>{complaint.daysOpen} days</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Category:</span>
                    <span className="capitalize">{complaint.category}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Location:</span>
                    <span>
                      {complaint.location
                        ? `${complaint.location.name} (${complaint.location.building})`
                        : 'Unknown'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Priority:</span>
                    <span className={`priority-badge priority-${complaint.priority}`}>
                      {complaint.priority}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Student:</span>
                    <span>{complaint.student?.name || 'Unknown'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Assigned To:</span>
                    <span>{complaint.assignedTo ? complaint.assignedTo.name : 'Unassigned'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Reported:</span>
                    <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="admin-complaint-actions">
                  <Link to={`/complaints/${complaint._id}`} className="btn-secondary btn-sm">
                    Record Follow-up
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
