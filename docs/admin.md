# Admin API Documentation

## Overview

Admin endpoints provide system-wide analytics for the CampusFix admin role. All endpoints require JWT authentication with the `admin` role. Faculty and students will receive `403 Forbidden`. Unauthenticated requests receive `401 Unauthorized`.

---

## Authentication

All requests must include:

```
Authorization: Bearer <jwt_token>
```

Passwords are never returned in any response.

---

## GET /api/admin/dashboard

Returns overall complaint statistics for the admin dashboard.

### Authorization
- `admin` → 200 OK
- `faculty` → 403 Forbidden
- `student` → 403 Forbidden
- unauthenticated → 401 Unauthorized

### Response (200)

```json
{
  "summary": {
    "totalComplaints": 42,
    "pendingComplaints": 10,
    "assignedComplaints": 8,
    "inProgressComplaints": 6,
    "resolvedComplaints": 15,
    "unresolvedComplaints": 27
  },
  "byCategory": [
    { "category": "technical", "count": 12 },
    { "category": "infrastructure", "count": 8 }
  ],
  "byLocation": [
    {
      "locationId": "<ObjectId>",
      "locationName": "Computer Lab 1",
      "building": "Main Block",
      "count": 7
    }
  ],
  "recentComplaints": [
    {
      "_id": "...",
      "title": "...",
      "category": "technical",
      "status": "pending",
      "student": { "name": "...", "email": "..." },
      "location": { "name": "...", "building": "..." },
      "createdAt": "..."
    }
  ],
  "unresolvedComplaintsList": [
    {
      "_id": "...",
      "title": "...",
      "category": "infrastructure",
      "priority": "high",
      "status": "pending",
      "student": { "name": "...", "email": "..." },
      "assignedTo": { "name": "..." },
      "location": { "name": "...", "building": "..." },
      "createdAt": "..."
    }
  ]
}
```

### Notes

- `unresolvedComplaints` counts complaints where status is NOT `resolved` or `rejected`.
- `unresolvedComplaintsList` is sorted oldest-first so long-pending issues appear at the top.
- `recentComplaints` is sorted newest-first.
- `student.password` is never included.

---

## GET /api/admin/recurring-issues

Returns complaint groups by `location + category` with complaint frequency analysis.

### Authorization
- `admin` → 200 OK
- `faculty` → 403 Forbidden
- `student` → 403 Forbidden
- unauthenticated → 401 Unauthorized

### Response (200)

Returns an array sorted by `complaintCount` descending.

```json
[
  {
    "location": {
      "id": "<ObjectId>",
      "name": "Computer Lab 1",
      "building": "Main Block"
    },
    "category": "technical",
    "complaintCount": 12,
    "unresolvedCount": 7,
    "frequencyLevel": "recurring",
    "latestComplaintDate": "2026-09-15T10:30:00.000Z"
  },
  {
    "location": {
      "id": "<ObjectId>",
      "name": "Library",
      "building": "Block B"
    },
    "category": "cleanliness",
    "complaintCount": 6,
    "unresolvedCount": 3,
    "frequencyLevel": "frequent",
    "latestComplaintDate": "2026-09-10T08:00:00.000Z"
  }
]
```

### Frequency Level Logic

`frequencyLevel` is calculated dynamically from `complaintCount` per location+category group. It is **not** stored in the database.

| complaintCount | frequencyLevel |
|---------------|----------------|
| 0 – 4         | `normal`       |
| 5 – 9         | `frequent`     |
| 10 or more    | `recurring`    |

This uses simple aggregation — no AI or prediction.

### Notes

- Complaints with missing locations are grouped as "Unknown Location" and handled safely.
- `unresolvedCount` counts complaints where status is NOT `resolved` or `rejected`.
- Statuses used from the Complaint model:
  - `pending`, `assigned`, `in_progress`, `follow_up_required` → **unresolved**
  - `resolved`, `rejected` → **resolved/final**

---

## Error Responses

| Status | Meaning |
|--------|---------|
| 401 | No token provided, or token is invalid/expired |
| 403 | Authenticated but role is not `admin` |
| 500 | Internal server error |

```json
{ "message": "Not authorized, no token provided" }
{ "message": "Forbidden: User role 'faculty' is not authorized to access this resource" }
{ "message": "Server Error" }
```
