# Offline Sync Documentation

## 1. Why CampusFix uses IndexedDB
CampusFix uses Dexie.js (a wrapper around IndexedDB) to store pending complaints locally when the user is offline. This allows users to report issues seamlessly even without a network connection. IndexedDB provides a reliable, structured, and persistent local storage mechanism that overcomes the limitations of `localStorage`.

## 2. Dexie Database Structure
The local database `CampusFixDB` has the following stores:
- `pendingComplaints`: Stores offline complaints awaiting synchronization. Fields include `clientRequestId`, `studentId`, `title`, `description`, `category`, `priority`, `location`, `latitude`, `longitude`, `createdAt`, `syncStatus`, `syncAttempts`, and `lastSyncError`.
- `locations`: Caches campus locations fetched while online, allowing offline local location verification.

## 3. Pending Complaint Lifecycle
1. **OFFLINE**: User is disconnected from the internet.
2. **Form submitted**: Student fills out and submits a complaint.
3. **IndexedDB**: The complaint is validated locally and saved in the `pendingComplaints` Dexie store.
4. **Pending Sync**: The complaint shows up as "Pending Sync" in My Complaints.
5. **Internet returns**: The app detects `navigator.onLine === true`.
6. **Sync**: The `syncPendingComplaints` service runs and pushes the complaint to the backend via POST `/api/complaints`.
7. **Backend verifies**: The backend verifies the location and creates the complaint.
8. **MongoDB**: The complaint is stored in the central database.
9. **Synced**: The local complaint is deleted/marked as synced, and the remote complaint replaces it in the UI.

## 4. Offline Location Verification
When offline, the frontend performs a local check using the cached `locations` data to ensure the user is within the allowed radius. This prevents invalid complaints from being stored in the offline queue.

## 5. Backend Authoritative Verification
The offline verification is strictly preliminary. When the complaint is synced, the backend still autonomously verifies the distance. If the user spoofed their location or the constraints changed, the backend will reject the request.

## 6. Automatic Sync
The `syncService.js` automatically triggers when the `window` fires an `online` event or when the app loads in an online state. It iterates over pending complaints and sends them to the backend.

## 7. Retry Behavior
If a sync fails (e.g., due to a brief network blip or server error), the `syncStatus` is marked as `failed`, the error message is recorded, and the `syncAttempts` counter increments. The user can manually retry using the "Sync Now" button, or it will retry on the next `online` event.

## 8. Duplicate Prevention using clientRequestId
When a complaint is saved offline, a unique `clientRequestId` (UUID) is generated. This ID is sent to the backend during sync. The backend checks if a complaint with this `clientRequestId` and the student's ID already exists. If it does, it simply returns the existing complaint, preventing duplicate creation even if the network fails midway through a response.

## 9. Online/Offline Behavior
An offline indicator is shown in the navigation bar when `navigator.onLine` is false. When the connection drops, forms save locally. When the connection returns, automatic syncing resumes.

## 10. Security Considerations
- **No Passwords Stored**: Passwords and sensitive data are not stored in IndexedDB.
- **Backend Authoritative**: The backend does not trust the `verified` or `syncStatus` flags from the client.
- **Identity Integrity**: The backend continues to extract the `student` ID from the JWT token, completely ignoring any `studentId` that the client might try to send. This prevents impersonation.
- **Idempotency Scoped**: The `clientRequestId` uniqueness check is scoped to the authenticated user, preventing one user from accessing another user's complaint by guessing their `clientRequestId`.
