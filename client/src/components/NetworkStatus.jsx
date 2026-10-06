import React, { useState, useEffect } from 'react';
import { syncPendingComplaints } from '../services/syncService.js';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      if (wasOffline) {
        setSyncing(true);
        try {
          await syncPendingComplaints();
        } finally {
          setTimeout(() => {
            setSyncing(false);
            setWasOffline(false);
          }, 2000);
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync check if already online and we had queued complaints
    if (navigator.onLine) {
      syncPendingComplaints();
    } else {
      setWasOffline(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  if (isOnline && !syncing) return null;

  if (!isOnline) {
    return (
      <div className="network-status network-status--offline">
        You're offline — complaints will be saved and synced later.
      </div>
    );
  }

  if (syncing) {
    return (
      <div className="network-status network-status--syncing">
        Back online — syncing pending complaints...
      </div>
    );
  }

  return null;
};

export default NetworkStatus;
