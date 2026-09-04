# CampusFix API Documentation (Placeholder)

> [!NOTE]
> This document outlines the planned REST API endpoints for CampusFix V1. These endpoints will be implemented in subsequent phases.

## Base URL
`http://localhost:5000`

---

## 1. System Health
- `GET /` - Root health check endpoint (Status: Active in Day 1)
  - **Response**: `{"message": "CampusFix API is running"}`

---

## 2. Authentication (Upcoming - Day 2+)
- `POST /api/auth/register` - Student/Faculty registration
- `POST /api/auth/login` - User login & JWT issuance
- `GET /api/auth/me` - Fetch authenticated user profile

---

## 3. Complaints Management (Upcoming)
- `POST /api/complaints` - Create a new complaint
- `GET /api/complaints` - List complaints (filtered by role/permissions)
- `GET /api/complaints/:id` - Get complaint details
- `PATCH /api/complaints/:id/status` - Update complaint status (Faculty/Admin)
- `POST /api/complaints/sync` - Bulk offline sync endpoint

---

## 4. Admin & Analytics (Upcoming)
- `GET /api/admin/stats` - Overall complaint resolution and pending stats
- `GET /api/admin/recurring` - Overview of repeated/recurring campus issues
