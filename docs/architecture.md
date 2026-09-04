# CampusFix Architecture & Workflow

CampusFix is an offline-first, location-aware campus complaint management Progressive Web App (PWA).

## Core Workflow

```
Student
   ↓
Create Complaint (with photo, description, category, and location)
   ↓
Faculty / Maintenance Dept
   ↓
Assign / Update Status (Pending → In Progress → Resolved)
   ↓
Resolution
   ↓
Admin Monitoring & Analytics (Escalations, Recurring Issues)
```

## Key Architectural Principles (V1)
- **Offline-First**: Allows students to log complaints locally even with spotty campus connectivity (indexed locally via Dexie.js / IndexedDB and synced when back online).
- **Location-Aware**: Captures issue locations across campus buildings and facilities for rapid maintenance dispatch.
- **Role-Based Access Control**:
  - **Student**: Submit, view status, and give feedback on personal complaints.
  - **Faculty / Staff**: Review assigned complaints, update progress, and mark resolved.
  - **Admin**: System-wide oversight, category management, recurring issue monitoring, and follow-ups.
- **Progressive Web App (PWA)**: Installable on mobile devices and desktops, fast loading, responsive.
- **No AI in V1**: Keeps the codebase robust, predictable, and easy to maintain without unnecessary complexity.
