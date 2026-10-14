# CampusFix Deployment & Production Readiness Guide

> [!IMPORTANT]
> **Status:** Backend Deployment Readiness & Render Setup (Day 17).
> Backend production readiness, dynamic PORT assignment, credential-safe health checks, and CORS rules have been validated. Render deployment instructions and Atlas network access requirements are prepared.

---

## 1. Deployment Progress Tracking

| Stage | Component | Status | Details |
| :--- | :--- | :--- | :--- |
| **Local Verification** | Backend Server (`server/`) | **Locally Verified** ✅ | `validateEnv`, dynamic `PORT`, credential-safe `/api/health`, and CORS tested and passing. |
| **Local Verification** | Frontend Build (`client/`) | **Locally Verified** ✅ | `npm run build` generates production bundle, manifest, and PWA service worker with zero errors. |
| **SPA & PWA Config** | Vercel SPA Routing (`client/vercel.json`) | **Locally Configured** ✅ | Rewrites configured to route deep paths (`/login`, `/admin`, etc.) to `/index.html` while serving static assets and PWA files directly. |
| **Git Synchronization** | Days 14, 15 & 16 Code | **Pending Push** ⏳ | Code prepared locally; awaiting user review and push to GitHub. |
| **Cloud Hosting Setup** | Node.js PaaS (Render) | **Pending User Action** ⏳ | Render Web Service to be created; live backend URL required. |
| **Cloud Database** | MongoDB Atlas Cluster | **Configured & Active** ✅ | Atlas cluster verified and reachable from backend. |
| **Backend Live Verification** | Backend Web Service | **Pending Live Deploy** ⏳ | Verification script `verify_live_deployment.js` ready to run once public URL is available. |
| **Frontend Deployment** | Static Host (Vercel) | **Locally Prepared** ✅ | Settings, build scripts, SPA rewrites, and environment requirements documented and ready. |
| **Live API Integration** | End-to-End CORS & Auth | **Pending Live Backend URL** ⏳ | Requires actual backend URL for `VITE_API_URL` and frontend origin for `CLIENT_URL`. |

---

## 2. Architecture Overview

CampusFix consists of two decoupled components and a managed database:
- **Backend API (`server/`)**: Express.js REST API with Mongoose, JWT authentication, and CORS middleware.
- **Frontend Client (`client/`)**: React 19 Single Page Application built with Vite and VitePWA for offline capability.
- **Database**: MongoDB (MongoDB Atlas cloud cluster).

```
[ Browser / Mobile Client ] (Vite + React PWA — Day 16)
           │
           │ HTTPS / REST (Configured via VITE_API_URL)
           ▼
[ Backend Web Service ] (Node.js on Render — Day 15)
           │
           │ Mongoose (Configured via MONGO_URI)
           ▼
[ Database ] (MongoDB Atlas Cluster)
```

---

## 3. Platform Selection: Why Render

For the backend API, **Render (render.com)** was selected based on the following evaluation:
1. **Free Tier Availability**: Provides a Free Web Service (512 MB RAM, free SSL/TLS certificate, automatic HTTPS) that does not require entering a credit card for basic deployment.
2. **Monorepo / Subdirectory Native Support**: Allows setting **Root Directory: `server`**, ensuring Render only executes commands in the backend folder without interfering with `client/`.
3. **Automatic Port Ingestion**: Render automatically assigns an internal port via `process.env.PORT` (usually `10000`) and routes incoming internet HTTPS traffic to it. Our backend dynamically listens on `process.env.PORT || 5000`.
4. **Zero-Configuration Health Check**: Render supports a custom health check path (`/api/health`) to ensure new instances are ready before traffic switches.

*(Alternative: Railway is also fully compatible; see Section 7 for Railway notes).*

---

## 4. Production Environment Variables

Configure these in your hosting provider's dashboard under **Environment**:

| Variable | Required | Recommended Production Value | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | **Yes** | `production` | Enables production optimizations and strict CORS checking. |
| `PORT` | Auto | *(Leave blank or let platform set)* | Injected automatically by Render. Local fallback is 5000. |
| `MONGO_URI` | **Yes** | `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/campusfix?retryWrites=true&w=majority` | Full MongoDB connection string. Credentials must be safely URL-encoded. |
| `JWT_SECRET` | **Yes** | *(64-character random string)* | Used to sign and verify user JWTs. Generate with `openssl rand -hex 32`. |
| `CLIENT_URL` | **Yes** | `http://localhost:5173` *(update to deployed frontend in Day 16)* | Allowed CORS origin. Supports comma-separated list of URLs or `*`. |

> [!CAUTION]
> **Never commit real credentials to Git.** Use the hosting dashboard's Environment Variables section to input secrets. Never paste real credentials into chat or source files.

---

## 5. MongoDB Atlas Readiness & Network Access

Before deploying the backend, verify your MongoDB Atlas cluster settings:

### 1. Database User Permissions
1. Go to **Database Access** in the Atlas sidebar.
2. Ensure you have a dedicated database user (e.g. `campusfix_app`).
3. Ensure its privileges are scoped to **Read and write to any database** (or specifically the `campusfix` database). Do not use an administrative role (`atlasAdmin`).
4. Ensure the password is strong. If the password contains special characters (like `@`, `:`, `/`, `?`, `#`, `[`), URL-encode them:
   - `@` → `%40`
   - `:` → `%3A`
   - `/` → `%2F`

### 2. Network Access (IP Allowlist) Trade-offs
In Atlas under **Network Access**, connections are restricted by IP address:

- **The Challenge with Cloud PaaS (Render, Railway)**:
  On free and entry-level tiers, hosting providers use a shared pool of dynamic outbound IP addresses that change on each deploy and container restart.
- **Option A — Allow Access from Anywhere (`0.0.0.0/0`) [Standard for Free Tier]**:
  - *How it works*: Allows connections from any IP that has valid database user credentials.
  - *Security Trade-off*: The cluster's public endpoint is accessible from the internet. Security relies entirely on the strength of the database username, password, and TLS encryption.
  - *Safeguards*: Ensure a long, random password (24+ characters) and ensure the database user is not an administrator.
- **Option B — Temporary Deployment Window**:
  - Atlas allows adding an IP with an automatic expiration (e.g., "Delete after 6 hours" or "Delete after 24 hours"). You can use this for temporary testing windows if desired.
- **Option C — Static Outbound IP (Paid / Enterprise)**:
  - If a strictly restricted IP allowlist is required, upgrade to a provider plan with static outbound IPs (or configure a NAT gateway).

---

## 6. Step-by-Step Backend Deployment Guide (Render)

Follow these steps with your GitHub account:

### Step 1: Push Local Commits to GitHub
*(Note: Complete this after reviewing Days 14 and 15 changes)*
```bash
git add .
git commit -m "feat: complete Day 14 production readiness and Day 15 backend deployment configuration"
git push origin main
```

### Step 2: Create Web Service on Render
1. Log into [Render](https://dashboard.render.com/).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository: `afsal2007/campusfix`.
4. Fill in the service configuration:
   - **Name**: `campusfix-api` (or any preferred name)
   - **Region**: Choose the region closest to your users / database
   - **Branch**: `main`
   - **Root Directory**: `server` ⚠️ *(CRITICAL: Must be set to `server`)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### Step 3: Enter Environment Variables
In the same page under the **Environment Variables** section, click **Add Environment Variable**:
1. `NODE_ENV` = `production`
2. `MONGO_URI` = *(your MongoDB Atlas connection string)*
3. `JWT_SECRET` = *(your random 64-character secret)*
4. `CLIENT_URL` = `http://localhost:5173` *(allows local frontend testing during Day 15; will add deployed frontend URL in Day 16)*

### Step 4: Configure Health Check Path
1. Under **Advanced**, find **Health Check Path**.
2. Set it to: `/api/health`
3. Click **Create Web Service**.

### Step 5: Wait for Build & Deploy
Render will clone the repository, navigate to `server`, run `npm install`, and launch `npm start`.
Once the logs show:
```text
Server is running on port 10000
MongoDB connected successfully
```
Render will mark the service as **Live** and provide a public URL (e.g., `https://campusfix-api.onrender.com`).

---

## 7. Verifying the Live Backend

Once your backend is live, run the automated verification script from your local terminal:

```bash
node server/scratch/verify_live_deployment.js https://<YOUR-RENDER-SERVICE-NAME>.onrender.com
```

This script performs 5 comprehensive checks:
1. **Root Endpoint (`GET /`)**: Verifies HTTP 200 and `{ message: "CampusFix API is running", status: "ok" }`.
2. **Health Endpoint (`GET /api/health`)**: Verifies HTTP 200, `{ status: "ok", database: "connected" }`, uptime, and ISO timestamp.
3. **Data Security**: Verifies that connection strings, passwords, and secrets are not leaked in any response.
4. **Authentication Protection**: Verifies that protected routes (`/api/complaints`, `/api/admin/dashboard`) return HTTP 401 Unauthorized when accessed without a token.
5. **CORS Headers**: Verifies that cross-origin requests include appropriate access-control headers.

---

## 8. Summary Checklist for Day 15

- [x] Backend package scripts verified (`start: node server.js`).
- [x] Startup environment validation verified (`validateEnv.js`).
- [x] Credential-safe health check endpoint verified (`/api/health`).
- [x] Dynamic `process.env.PORT` handling verified.
- [x] CORS configured for development and production origins.
- [x] MongoDB Atlas readiness and security trade-offs documented.
- [x] Step-by-step hosting guide documented.
- [x] Automated live verification script created (`verify_live_deployment.js`).
- [ ] Push local Days 14 & 15 commits to GitHub *(User action)*.
- [ ] Create Render Web Service and configure environment variables *(User action)*.
- [ ] Run live verification check against the deployed URL *(User action)*.

---

## 9. Step-by-Step Frontend Deployment Guide (Vercel)

The CampusFix frontend is a React + Vite Single Page Application (PWA). Follow these steps to deploy it on [Vercel](https://vercel.com/):

### Step 1: Import Project into Vercel
1. Log into your Vercel account at [vercel.com](https://vercel.com/).
2. Click **Add New...** → **Project**.
3. Select and import the Git repository: `afsal2007/campusfix`.

### Step 2: Configure Project Settings
In the **Configure Project** setup screen:
- **Project Name**: `campusfix` (or your preferred name)
- **Framework Preset**: `Vite`
- **Root Directory**: Click **Edit** and select **`client`** ⚠️ *(CRITICAL: Must point to `client`)*
- **Build and Output Settings**:
  - **Build Command**: `npm run build` (override if not auto-detected)
  - **Output Directory**: `dist`
  - **Install Command**: `npm install`

### Step 3: Configure Environment Variables
Under the **Environment Variables** section:
- **Key**: `VITE_API_URL`
- **Value**: `https://<YOUR-RENDER-BACKEND-SERVICE-NAME>.onrender.com/api`
  > [!IMPORTANT]
  > **Build-Time Ingestion Note**: Vite embeds environment variables prefixed with `VITE_` into the JavaScript bundle at **build time**. If the backend URL changes later, you must trigger a new deployment or rebuild in Vercel for the changes to take effect.
  >
  > **Security Reminder**: Never place server-side secrets (such as `JWT_SECRET` or `MONGO_URI`) into frontend environment variables. Only public client configurations belong in `VITE_*`.

### Step 4: Single Page Application (SPA) Routing & PWA Compatibility
To prevent HTTP 404 errors when refreshing direct nested routes (such as `/login`, `/admin`, `/faculty`, `/complaints`), the repository includes [`client/vercel.json`](file:///c:/Users/SMILE/Desktop/projects/campusfix/client/vercel.json):
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
- **Static Assets Precedence**: Vercel evaluates static output files in `dist` first. PWA assets (`manifest.webmanifest`, `sw.js`, `registerSW.js`, icons, CSS, and JS bundles) are served directly without redirection.
- **Client-Side Routing**: Any unmatched path is routed to `index.html` with HTTP 200, allowing `react-router-dom` to render the correct view.

---

## 10. Live Integration & Verification Status

> [!WARNING]
> **Backend Status: Unverified / Pending Deployment**
> Live login, authentication tokens, and API integration cannot be tested online until the backend is deployed to Render and its actual public URL is verified.
> **Do not invent or assume a placeholder backend URL in production.**

### Post-Backend Deployment Integration Checklist
Once the backend is live on Render:
1. **Set Frontend URL in Backend**:
   - In the Render dashboard under **Environment Variables**, update `CLIENT_URL` with your actual Vercel domain (e.g., `https://campusfix.vercel.app`).
   - This ensures the Express backend's CORS policy permits requests from your Vercel frontend.
2. **Set Backend URL in Frontend**:
   - In the Vercel dashboard under **Settings** → **Environment Variables**, ensure `VITE_API_URL` points to `https://<YOUR-RENDER-BACKEND>.onrender.com/api`.
   - Redeploy the project so Vite bundles the live backend URL into the production build.
3. **End-to-End Verification Flow**:
   - [ ] Navigate to the Vercel production URL over HTTPS.
   - [ ] Verify that the service worker activates and the PWA manifest is detected.
   - [ ] Test direct navigation and refresh on `/login`, `/faculty`, and `/admin`.
   - [ ] Sign in with test credentials and verify JWT storage in `localStorage`.
   - [ ] Submit a test complaint and verify status updates in the dashboard.
   - [ ] Check DevTools Network tab to confirm no CORS errors occur.

---

## 11. Summary Checklist for Day 16

- [x] Frontend production build validated locally (`client/dist`).
- [x] Centralized API client verified (`client/src/services/api.js` consumes `VITE_API_URL`).
- [x] Vercel SPA routing configuration created (`client/vercel.json`).
- [x] PWA manifest, service worker, and icons verified intact.
- [x] Secret audit confirmed no credentials leaked into client bundle.
- [x] HTML title updated to `CampusFix` in `client/index.html`.
- [x] Vercel deployment guide and configuration documented.
- [ ] Deploy backend to Render and verify live URL *(Pending User)*.
- [ ] Connect `VITE_API_URL` in Vercel and `CLIENT_URL` in Render *(Pending User)*.

---

## 12. Summary Checklist for Day 17

- [x] Inspected backend architecture (`package.json`, `server.js`, `validateEnv.js`, `db.js`, routes).
- [x] Verified dynamic Render `PORT` binding (`process.env.PORT || 5000`) without hardcoded ports.
- [x] Verified `/api/health` safety (returns `{ status, database, uptime, timestamp }` without leaking credentials).
- [x] Verified required environment variables documented in `server/.env.example` (no secrets exposed).
- [x] Verified Render configuration: Root Directory `server`, Build `npm install`, Start `npm start`.
- [x] Verified MongoDB Atlas connection requirements and documented dynamic IP options and risks.
- [x] Verified CORS origin configuration supporting production Vercel frontend origins.
- [x] Ran non-destructive test suite (`server/scratch/verify_day17_render.js`) passing 13/13 checks.
- [ ] Push local commits to GitHub *(User action)*.
- [ ] Configure MongoDB Atlas Network Access allowlist *(User action)*.
- [ ] Create Render Web Service and enter environment variables *(User action)*.
- [ ] Verify live backend URL with `verify_live_deployment.js` *(User action / Next step)*.
