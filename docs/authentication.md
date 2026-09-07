# CampusFix — Authentication & User Identity Documentation

## Overview

CampusFix V1 uses **JSON Web Token (JWT)** based authentication with **bcryptjs** password hashing to manage user authentication and role-based access control.

All registered users belong to one of three roles:
- **`student`**: Default role assigned upon public registration. Can create and view complaints.
- **`faculty`**: Assigned role for staff/faculty members who manage, assign, and update complaints.
- **`admin`**: System administrators with full management privileges.

> [!IMPORTANT]
> Public registration endpoints exclusively create user accounts with the **`student`** role. Faculty and Admin accounts are managed directly or provisioned securely.

---

## Security Architecture

1. **Password Hashing**: Passwords are hashed before database insertion using `bcryptjs` with 10 salt rounds. Plain-text passwords are never stored.
2. **Token Generation**: Upon successful registration or login, the server issues a JWT signed with `JWT_SECRET` configured in `.env`.
3. **JWT Payload**: Contains `userId` and `role` only. Sensitive data (such as passwords) are strictly excluded from JWT tokens.
4. **Token Expiration**: JWT tokens expire after 7 days (`7d`).
5. **Sanitized Responses**: All user objects returned by auth endpoints strip the `password` field completely.

---

## Authentication Endpoints

### 1. Register Student Account

Creates a new student user account and returns a JWT token.

- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Access**: Public

#### Request Body
```json
{
  "name": "Alex Johnson",
  "registerNumber": "23IT001",
  "department": "Information Technology",
  "year": 3,
  "className": "A",
  "email": "alex@example.com",
  "password": "password123"
}
```

#### Field Constraints
- `name`: Required, string
- `registerNumber`: Required, string, unique
- `department`: Required, string
- `year`: Required, number (1 to 5)
- `className`: Required, string
- `email`: Required, valid email format, unique
- `password`: Required, minimum 6 characters

#### Success Response (`201 Created`)
```json
{
  "message": "Student registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64d0a1b2c3d4e5f6a7b8c9d0",
    "name": "Alex Johnson",
    "registerNumber": "23IT001",
    "department": "Information Technology",
    "year": 3,
    "className": "A",
    "email": "alex@example.com",
    "role": "student",
    "createdAt": "2026-09-07T19:30:00.000Z",
    "updatedAt": "2026-09-07T19:30:00.000Z"
  }
}
```

#### Error Responses
- `400 Bad Request`: Missing required fields, invalid email format, password < 6 chars, or duplicate `email` / `registerNumber`.

---

### 2. User Login

Authenticates a user with email and password, returning a JWT token.

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Access**: Public

#### Request Body
```json
{
  "email": "alex@example.com",
  "password": "password123"
}
```

#### Success Response (`200 OK`)
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64d0a1b2c3d4e5f6a7b8c9d0",
    "name": "Alex Johnson",
    "registerNumber": "23IT001",
    "department": "Information Technology",
    "year": 3,
    "className": "A",
    "email": "alex@example.com",
    "role": "student",
    "createdAt": "2026-09-07T19:30:00.000Z",
    "updatedAt": "2026-09-07T19:30:00.000Z"
  }
}
```

#### Error Responses
- `400 Bad Request`: Missing email or password.
- `401 Unauthorized`: Invalid email or password.

---

### 3. Get Current User Profile

Retrieves the authenticated user's profile information.

- **URL**: `/api/auth/me`
- **Method**: `GET`
- **Access**: Private (Requires valid JWT)

#### Headers
```
Authorization: Bearer <JWT_TOKEN>
```

#### Success Response (`200 OK`)
```json
{
  "user": {
    "_id": "64d0a1b2c3d4e5f6a7b8c9d0",
    "name": "Alex Johnson",
    "registerNumber": "23IT001",
    "department": "Information Technology",
    "year": 3,
    "className": "A",
    "email": "alex@example.com",
    "role": "student",
    "createdAt": "2026-09-07T19:30:00.000Z",
    "updatedAt": "2026-09-07T19:30:00.000Z"
  }
}
```

#### Error Responses
- `401 Unauthorized`: Missing token, invalid/expired token, or user no longer exists.

---

## Middleware Summary

### `protect` (`server/middleware/authMiddleware.js`)
- Validates the `Authorization: Bearer <token>` header.
- Verifies JWT signature using `JWT_SECRET`.
- Loads user document from MongoDB (excluding `password`).
- Attaches user object to `req.user`.

### `authorizeRoles(...roles)` (`server/middleware/roleMiddleware.js`)
- Verifies that `req.user.role` matches one of the specified allowed roles.
- Returns `403 Forbidden` if the user's role is not allowed.

Example usage in future routes:
```javascript
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

// Route restricted to faculty and admin
router.patch('/complaints/:id/status', protect, authorizeRoles('faculty', 'admin'), updateComplaintStatus);
```
