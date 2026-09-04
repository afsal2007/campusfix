# CampusFix V1

CampusFix is an offline-first, location-aware campus complaint management Progressive Web App (PWA).

## 📌 Project Purpose
CampusFix empowers students to report campus issues (such as Wi-Fi outages, classroom repairs, laboratory equipment faults, electrical problems, cleanliness, and water issues) effortlessly. Faculty and facility teams can manage and resolve assigned complaints, while Administrators can oversee campus-wide operational health.

## 🚀 Key Features (V1 Roadmap)
- **Offline-First Reporting**: Store reports locally when offline and sync automatically upon network reconnection.
- **Location-Aware Tracking**: Tag and locate issues across specific campus buildings and facilities.
- **Role-Based Workflows**: Tailored interfaces for Students, Faculty, and Administrators.
- **PWA Experience**: Mobile-friendly, installable, and responsive web application.
- **No AI in V1**: Clean, lightweight, reliable full-stack architecture.

## 🛠 Tech Stack

### Frontend
- React
- Vite
- JavaScript
- React Router
- Axios
- Dexie.js (IndexedDB wrapper)
- vite-plugin-pwa
- Vanilla CSS

### Backend
- Node.js
- Express.js
- MongoDB & Mongoose
- JSON Web Tokens (JWT)
- bcryptjs
- CORS & dotenv

---

## 📁 Project Structure

```
campusfix/
├── client/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       ├── services/
│       ├── hooks/
│       ├── utils/
│       ├── context/
│       ├── db/
│       └── App.jsx
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.js
│
├── docs/
│   ├── architecture.md
│   └── api.md
│
├── .gitignore
└── README.md
```

---

## 💻 Getting Started (Development)

### 1. Backend Setup

```bash
cd server
npm install
npm run dev
```
Backend will run at: `http://localhost:5000`

Health check:
```bash
GET http://localhost:5000/
# Output: {"message": "CampusFix API is running"}
```

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev
```
Frontend will run at: `http://localhost:5173` (or port indicated by Vite).

---

## 📅 Current Development Status
- **Day 1: Completed** — Core development foundations, directory scaffolding, PWA config, health-check API, and documentation.
- **Day 2: Up Next** — Database connectivity, User Models, Authentication (JWT), and registration/login foundations.
