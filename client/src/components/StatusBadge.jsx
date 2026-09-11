import React from 'react';

/**
 * Maps raw backend status values to user-friendly labels and colors.
 */
const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    colour: '#f59e0b',
    bg: '#fef3c7',
  },
  assigned: {
    label: 'Assigned',
    colour: '#2563eb',
    bg: '#dbeafe',
  },
  in_progress: {
    label: 'In Progress',
    colour: '#7c3aed',
    bg: '#ede9fe',
  },
  resolved: {
    label: 'Resolved',
    colour: '#059669',
    bg: '#d1fae5',
  },
  closed: {
    label: 'Closed',
    colour: '#4b5563',
    bg: '#f3f4f6',
  },
  rejected: {
    label: 'Rejected',
    colour: '#dc2626',
    bg: '#fee2e2',
  },
  follow_up_required: {
    label: 'Follow-up Required',
    colour: '#ea580c',
    bg: '#ffedd5',
  },
};

const StatusBadge = ({ status }) => {
  const normalizedKey = (status || '').toLowerCase().trim();
  const config = STATUS_CONFIG[normalizedKey] || {
    label: status ? status.replace(/_/g, ' ') : 'Unknown',
    colour: '#6b7280',
    bg: '#f3f4f6',
  };

  return (
    <span
      className={`status-badge status-badge--${normalizedKey}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.85rem',
        fontWeight: '600',
        color: config.colour,
        backgroundColor: config.bg,
        border: `1px solid ${config.colour}40`,
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '0.5rem',
          height: '0.5rem',
          borderRadius: '50%',
          backgroundColor: config.colour,
          marginRight: '0.4rem',
        }}
      />
      {config.label}
    </span>
  );
};

export default StatusBadge;
