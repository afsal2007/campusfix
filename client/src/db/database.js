import Dexie from 'dexie';

const db = new Dexie('CampusFixDB');

db.version(1).stores({
  pendingComplaints: '++id, clientRequestId, studentId, syncStatus, createdAt',
  locations: 'id, name, building'
});

export default db;
