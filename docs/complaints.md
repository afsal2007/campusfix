# CampusFix — Complaint System (Day 4)

## Overview

Students can submit campus complaints through the CampusFix system. Each complaint is tied to the authenticated student via JWT — the frontend never determines complaint ownership.

## Complaint Lifecycle

```
Student → Login → JWT → POST /api/complaints → protect middleware → req.user._id → Complaint saved → status: pending
```

A complaint starts as **pending** and moves through states as faculty/admin take action (future days).

## Complaint Fields

| Field         | Type       | Required | Default   | Description                              |
| ------------- | ---------- | -------- | --------- | ---------------------------------------- |
| student       | ObjectId   | Yes      | —         | Reference to User (set from JWT)         |
| location      | ObjectId   | Yes      | —         | Reference to Location                    |
| title         | String     | Yes      | —         | Short summary of the issue               |
| description   | String     | Yes      | —         | Detailed description of the issue        |
| category      | String     | Yes      | —         | One of the valid category values          |
| status        | String     | No       | pending   | Current complaint status                 |
| priority      | String     | No       | medium    | Urgency level                            |

### Status Values

| Value              | Description                          |
| ------------------ | ------------------------------------ |
| pending            | Newly submitted, awaiting action     |
| assigned           | Assigned to faculty/staff            |
| in_progress        | Actively being worked on             |
| resolved           | Issue has been fixed                 |
| rejected           | Complaint was rejected               |
| follow_up_required | Needs additional follow-up           |

### Priority Values

| Value  | Description                        |
| ------ | ---------------------------------- |
| low    | Non-urgent, can wait               |
| medium | Standard priority (default)        |
| high   | Should be addressed soon           |
| urgent | Requires immediate attention       |

### Category Values

| Value          | Description                        |
| -------------- | ---------------------------------- |
| academic       | Classroom, exams, faculty issues   |
| infrastructure | Buildings, furniture, facilities   |
| technical      | Wi-Fi, computers, projectors       |
| cleanliness    | Hygiene, waste, sanitation         |
| safety         | Security, lighting, hazards        |
| transport      | Bus, parking, transport issues     |
| hostel         | Hostel-related problems            |
| other          | Anything not covered above         |

## API Endpoints

### POST /api/complaints

**Create a new complaint.**

- **Auth**: Required (JWT via `Authorization: Bearer <token>`)
- **Role**: Any authenticated user

**Request body:**

```json
{
  "location": "LOCATION_OBJECT_ID",
  "title": "Wi-Fi not working",
  "description": "The Wi-Fi connection is not working in Computer Lab 2.",
  "category": "technical",
  "priority": "medium"
}
```

**IMPORTANT — Student Identity Handling:**

The frontend does **NOT** send a `student` field. Even if a client sends a `student` field in the request body, the backend **ignores** it and always uses:

```js
student: req.user._id
```

This ensures a user can never create a complaint on behalf of another user.

**Validation:**

- `title` — required, non-empty
- `description` — required, non-empty
- `location` — required, must be a valid ObjectId referencing an existing Location
- `category` — required, must be one of the valid category values
- `priority` — optional (defaults to `medium`), must be a valid priority value

**Success Response (201):**

```json
{
  "message": "Complaint created successfully",
  "complaint": { ... }
}
```

**Error Responses:**

| Status | Condition                   |
| ------ | --------------------------- |
| 400    | Missing or invalid fields   |
| 401    | No token / invalid token    |
| 404    | Location not found          |
| 500    | Server error                |

---

### GET /api/complaints/my

**Get all complaints belonging to the authenticated student.**

- **Auth**: Required (JWT)
- **Role**: Any authenticated user

The backend filters by `req.user._id` — a student can **never** see another student's complaints through this endpoint.

**Populated fields:**

- `student`: name, registerNumber, department, year, className
- `location`: name, building

**Sorting:** Newest first (`createdAt: -1`)

**Success Response (200):**

```json
{
  "complaints": [ ... ]
}
```

---

### GET /api/complaints

**Get all complaints across the campus.**

- **Auth**: Required (JWT)
- **Role**: `faculty` or `admin` only (Students receive 403 Forbidden)

Fetches every complaint in the database, used by the Faculty Dashboard.

**Populated fields:**

- `student`: name, registerNumber, department, year, className
- `location`: name, building

**Sorting:** Newest first (`createdAt: -1`)

**Success Response (200):**

```json
{
  "complaints": [ ... ]
}
```

**Error Responses:**

| Status | Condition                   |
| ------ | --------------------------- |
| 401    | No token / invalid token    |
| 403    | User role is 'student'      |
| 500    | Server error                |

---

### GET /api/locations

**Get all available campus locations.**

- **Auth**: Not required (public read-only)

**Sorting:** Alphabetical by name

**Success Response (200):**

```json
{
  "locations": [ ... ]
}
```

## Location Selection

Students select from existing campus locations stored in the `Location` model. Arbitrary location strings are not accepted — a valid Location ObjectId is required.

Locations are seeded via `server/seed/locations.js` for development.

## Database Indexes

The Complaint model includes the following indexes for efficient querying:

- `student` — fast lookup of a student's complaints
- `location` — complaints by location
- `status` — filter by status
- `category` — filter by category
- `createdAt` (descending) — newest-first sorting
- `{ student, createdAt }` (compound) — efficient student complaint history

## Security Model

1. JWT is required for all complaint operations
2. The `protect` middleware verifies the JWT and attaches `req.user`
3. Complaint ownership is **always** derived from `req.user._id`
4. The client-supplied `student` field is ignored/stripped
5. `GET /api/complaints/my` only returns the authenticated user's complaints
6. Passwords are never included in populated user data

## Architecture

```
Student
   ↓
Login
   ↓
JWT
   ↓
Complaint API
   ↓
protect middleware
   ↓
req.user
   ↓
Complaint.student = req.user._id
   ↓
MongoDB
   ↓
status: pending
```
