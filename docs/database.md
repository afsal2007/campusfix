# CampusFix — Database Documentation

## Overview

CampusFix uses **MongoDB Atlas** as its database, accessed via **Mongoose** ORM.

Database name: `campusfix`

---

## Collections

### 1. `users`

Stores all users of the system — students, faculty, and admins.

| Field           | Type     | Required | Notes                                      |
|-----------------|----------|----------|--------------------------------------------|
| `_id`           | ObjectId | Auto     | MongoDB auto-generated primary key         |
| `name`          | String   | Yes      | Full name of the user                      |
| `registerNumber`| String   | Yes      | Unique register/employee number            |
| `department`    | String   | Yes      | Department name                            |
| `year`          | Number   | Yes      | Academic year (1–5)                        |
| `className`     | String   | Yes      | Class or section name                      |
| `email`         | String   | Yes      | Unique email address                       |
| `password`      | String   | Yes      | Hashed password (bcrypt — Day 3)           |
| `role`          | String   | Yes      | `student` \| `faculty` \| `admin`          |
| `createdAt`     | Date     | Auto     | Mongoose timestamp                         |
| `updatedAt`     | Date     | Auto     | Mongoose timestamp                         |

**Indexes:** `email`, `registerNumber`

---

### 2. `locations`

Stores campus locations used for complaint submission and GPS verification.

| Field           | Type     | Required | Notes                                      |
|-----------------|----------|----------|--------------------------------------------|
| `_id`           | ObjectId | Auto     | MongoDB auto-generated primary key         |
| `name`          | String   | Yes      | Human-readable location name               |
| `building`      | String   | Yes      | Building name                              |
| `latitude`      | Number   | Yes      | GPS latitude                               |
| `longitude`     | Number   | Yes      | GPS longitude                              |
| `allowedRadius` | Number   | Yes      | Max allowed distance in meters (default 50)|
| `createdAt`     | Date     | Auto     | Mongoose timestamp                         |
| `updatedAt`     | Date     | Auto     | Mongoose timestamp                         |

---

### 3. `complaints`

Stores all campus complaints submitted by students.

| Field         | Type     | Required | Notes                                               |
|---------------|----------|----------|-----------------------------------------------------|
| `_id`         | ObjectId | Auto     | MongoDB auto-generated primary key                  |
| `student`     | ObjectId | Yes      | Ref → `users`                                       |
| `category`    | String   | Yes      | e.g. "Electrical", "Plumbing", "Cleanliness"        |
| `title`       | String   | Yes      | Short complaint title                               |
| `description` | String   | Yes      | Detailed complaint description                      |
| `location`    | ObjectId | No       | Ref → `locations`                                   |
| `latitude`    | Number   | No       | GPS latitude at time of submission                  |
| `longitude`   | Number   | No       | GPS longitude at time of submission                 |
| `status`      | String   | Auto     | See status flow below (default: `pending`)          |
| `priority`    | String   | Auto     | `low` \| `medium` \| `high` \| `urgent` (default: `medium`) |
| `assignedTo`  | ObjectId | No       | Ref → `users` (faculty)                             |
| `actionTaken` | String   | No       | Brief description of action taken                   |
| `resolution`  | String   | No       | Resolution notes                                    |
| `followUpDate`| Date     | No       | Scheduled follow-up date                            |
| `resolvedAt`  | Date     | No       | Timestamp when resolved                             |
| `createdAt`   | Date     | Auto     | Mongoose timestamp                                  |
| `updatedAt`   | Date     | Auto     | Mongoose timestamp                                  |

**Indexes:** `student`, `location`, `status`, `category`, `createdAt`

---

### 4. `complaintactions`

Preserves the full audit history of every action taken on a complaint.

| Field         | Type     | Required | Notes                                          |
|---------------|----------|----------|------------------------------------------------|
| `_id`         | ObjectId | Auto     | MongoDB auto-generated primary key             |
| `complaint`   | ObjectId | Yes      | Ref → `complaints`                             |
| `performedBy` | ObjectId | Yes      | Ref → `users`                                  |
| `action`      | String   | Yes      | Action label, e.g. "assigned", "in_progress"   |
| `comment`     | String   | No       | Optional note from faculty/admin               |
| `createdAt`   | Date     | Auto     | Mongoose timestamp                             |

---

## Relationships

```
User
 │
 ├──────────────────────┐
 │                      │
 ▼ (student)            ▼ (assignedTo)
Complaint          ComplaintAction
 │                      │
 ▼ (location)           │ (performedBy → User)
Location                │
                        ▼ (complaint → Complaint)
```

- A **User** (student) can have many **Complaints**.
- A **User** (faculty) can be assigned to many **Complaints**.
- A **Complaint** optionally belongs to a **Location**.
- A **ComplaintAction** belongs to one **Complaint** and one **User**.
- Each action preserves the history trail of a complaint.

---

## Complaint Status Flow

### Normal flow:
```
pending
   ↓
assigned
   ↓
in_progress
   ↓
resolved
```

### Alternative flows:
```
pending → rejected
pending → follow_up_required
assigned → follow_up_required
in_progress → follow_up_required
```

---

## Priority Levels

| Level    | Use Case                             |
|----------|--------------------------------------|
| `low`    | Minor inconvenience                  |
| `medium` | Standard complaint (default)         |
| `high`   | Affects many students or safety risk |
| `urgent` | Immediate attention required         |
