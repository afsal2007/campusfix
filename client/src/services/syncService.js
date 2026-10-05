import db from '../db/database.js';
import api from './api.js';

export const syncPendingComplaints = async () => {
  if (!navigator.onLine) return;

  const pendingComplaints = await db.pendingComplaints.toArray();
  if (pendingComplaints.length === 0) return;

  for (const complaint of pendingComplaints) {
    if (complaint.syncStatus === 'synced') {
      // Clean up already synced (just in case they weren't deleted)
      await db.pendingComplaints.delete(complaint.id);
      continue;
    }

    try {
      await db.pendingComplaints.update(complaint.id, {
        syncStatus: 'syncing',
        syncAttempts: (complaint.syncAttempts || 0) + 1,
        lastSyncAttempt: new Date().toISOString()
      });

      // Submit to backend
      await api.post('/complaints', {
        title: complaint.title,
        description: complaint.description,
        category: complaint.category,
        priority: complaint.priority,
        location: complaint.location,
        latitude: complaint.latitude,
        longitude: complaint.longitude,
        clientRequestId: complaint.clientRequestId
      });

      // Success
      await db.pendingComplaints.update(complaint.id, {
        syncStatus: 'synced',
        lastSyncError: null
      });
      // Optionally delete synced complaints to keep DB clean
      await db.pendingComplaints.delete(complaint.id);

    } catch (error) {
      // Failed to sync
      const msg = error.response?.data?.message || error.message || 'Unknown error during sync';
      await db.pendingComplaints.update(complaint.id, {
        syncStatus: 'failed',
        lastSyncError: msg
      });
    }
  }
};
