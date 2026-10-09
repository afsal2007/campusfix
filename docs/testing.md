# CampusFix — Day 13 Testing Report

**Date:** 2026-10-09  
**Scope:** V1 workflow audit, backend integration tests, frontend build, access-control review  
**Environment:** Node v24.19, MongoDB Atlas (live), Vite 8.2.2, Windows

---

## 1. Tests Executed

### 1.1 Backend Integration Tests (40 tests — Node.js against live server)

All 40 tests ran against `http://localhost:5000` using the real MongoDB Atlas database with isolated test data (unique timestamps). No mocks were used.

| #  | Test | Result |
|----|------|--------|
| 1a | Register student → 201, token, role=student | ✅ PASS |
| 1b | Register with `role=admin` in body → still gets student | ✅ PASS |
| 1c | Duplicate email → 400 | ✅ PASS |
| 1d | Missing required fields → 400 | ✅ PASS |
| 1e | Short password (<6 chars) → 400 | ✅ PASS |
| 1f | No password field in register response | ✅ PASS |
| 2a | Valid login → 200 + token | ✅ PASS |
| 2b | Wrong password → 401 | ✅ PASS |
| 2c | Non-existent user → 401 | ✅ PASS |
| 2d | Missing login fields → 400 | ✅ PASS |
| 2e | No password field in login response | ✅ PASS |
| 3  | GET /complaints/my no-token → 401 | ✅ PASS |
| 3  | POST /complaints no-token → 401 | ✅ PASS |
| 3  | GET /complaints no-token → 401 | ✅ PASS |
| 3  | GET /auth/me no-token → 401 | ✅ PASS |
| 3  | GET /admin/dashboard no-token → 401 | ✅ PASS |
| 3  | GET /admin/recurring-issues no-token → 401 | ✅ PASS |
| 3  | GET /admin/follow-ups no-token → 401 | ✅ PASS |
| 3  | GET /users/faculty no-token → 401 | ✅ PASS |
| 4a | Student GET /complaints (all) → 403 | ✅ PASS |
| 4b | Student GET /admin/dashboard → 403 | ✅ PASS |
| 4c | Student GET /admin/recurring-issues → 403 | ✅ PASS |
| 4d | Student GET /admin/follow-ups → 403 | ✅ PASS |
| 4e | Student GET /users/faculty → 403 | ✅ PASS |
| 5a | GET /locations (public) → success | ✅ PASS |
| 5b | Create complaint (valid, near location) → 201 | ✅ PASS |
| 5c | Idempotency: same clientRequestId → 200 with same complaint | ✅ PASS |
| 5d | Second complaint (different clientRequestId) → 201 | ✅ PASS |
| 5e | Location enforcement: far coordinates → 403 | ✅ PASS |
| 5f | Missing title → 400 | ✅ PASS |
| 5g | Invalid category → 400 | ✅ PASS |
| 5h | GET /complaints/my → returns complaints | ✅ PASS |
| 5i | GET /complaints/:id (own) → 200 | ✅ PASS |
| 6a | Student B read Student A's complaint → 403 (IDOR blocked) | ✅ PASS |
| 6b | Student assign complaint → 403 | ✅ PASS |
| 6c | Student change complaint status → 403 | ✅ PASS |
| 6d | Student add action → 403 | ✅ PASS |
| 6e | Student add follow-up → 403 | ✅ PASS |
| 7a | GET /auth/me → user object, no password | ✅ PASS |
| 8a | Health check → database connected | ✅ PASS |

**Result: 40 passed, 0 failed, 0 blocked**

### 1.2 Frontend Production Build

| Check | Result |
|-------|--------|
| `npm run build` exits with code 0 | ✅ PASS |
| 97 modules transformed, no errors | ✅ PASS |
| PWA service worker generated (`sw.js`, `workbox-*.js`) | ✅ PASS |
| Manifest generated (`manifest.webmanifest`) | ✅ PASS |
| 8 precache entries (443 KiB) | ✅ PASS |

### 1.3 Code Audit — Access Control Review

| Verification Point | Result | Detail |
|--------------------|--------|--------|
| Public registration always assigns `student` role | ✅ PASS | `authController.js:110` hardcodes `role: 'student'` |
| `role` field in request body is ignored during registration | ✅ PASS | Tested by sending `role: 'admin'` — response still shows `student` |
| Faculty/admin cannot be provisioned via public API | ✅ PASS | No public endpoint creates non-student roles |
| `authMiddleware.js` returns 401 for missing/invalid tokens | ✅ PASS | All 8 protected endpoints tested |
| `roleMiddleware.js` returns 403 for unauthorized roles | ✅ PASS | Student blocked from all faculty/admin endpoints |
| Admin routes use `authorizeRoles('admin')` middleware | ✅ PASS | `adminRoutes.js:11` applies it globally via `router.use()` |
| Complaint routes enforce `authorizeRoles('faculty', 'admin')` on assign/status/actions/follow-up | ✅ PASS | `complaintRoutes.js:21-30` |
| Student ownership check on `GET /complaints/:id` | ✅ PASS | `complaintController.js:196` |
| `student` field always set from `req.user._id`, never `req.body` | ✅ PASS | `complaintController.js:105` |
| Password excluded from API responses (`select('-password')`) | ✅ PASS | `authMiddleware.js:23`, `authController.js:15-28` |
| JWT secret not exposed in responses or frontend | ✅ PASS | Only used server-side in `authMiddleware.js` and `authController.js` |
| Frontend `ProtectedRoute` checks `user` and `allowedRoles` | ✅ PASS | `ProtectedRoute.jsx:15-21` |
| Faculty dashboard route requires `['faculty', 'admin']` | ✅ PASS | `App.jsx:157` |
| Admin dashboard route requires `['admin']` | ✅ PASS | `App.jsx:165` |

---

## 2. Bugs Fixed

### BUG-1: Login always redirected to `/complaints` regardless of role

**File:** `client/src/pages/Login.jsx`  
**Symptom:** Faculty and admin users were sent to the student complaints page after login instead of their respective dashboards.  
**Fix:** Added role-based redirect — `admin → /admin`, `faculty → /faculty`, `student → /complaints`.  
**Lines changed:** 3 removed, 9 added.

---

## 3. Issues Identified (Not Fixed — Outside V1 Scope or Non-Critical)

| Issue | Severity | Detail |
|-------|----------|--------|
| Dead code: `getFacultyComplaints()` in `api.js:77-80` | Low | Calls `GET /complaints/faculty/assigned` — route does not exist on backend. Function is **not called** by any component, so no runtime impact. |
| No existing test suite | Medium | `package.json` has no `test` script. `supertest` is installed as devDependency but no test files exist. Day 13 used a temporary Node.js script for integration testing. |
| No admin/faculty seed script in project | Low | Faculty and admin accounts must be provisioned manually via MongoDB or a one-off script. No permanent seed mechanism in the repo. |
| User model `year` field has `min: 1` validation | Low | Prevents creating admin/faculty with `year: 0`. Not a runtime issue since admin/faculty are provisioned directly in the DB, not via the public register endpoint. |

---

## 4. Blocked Tests

| Test Area | Reason |
|-----------|--------|
| Browser-based frontend interaction (login flow, forms, navigation) | Playwright driver download returned HTTP 404 (external infrastructure issue) |
| Offline complaint creation in browser | Requires browser DevTools; Playwright unavailable |
| IndexedDB persistence verification | Requires browser environment |
| Service worker cache verification | Requires browser environment |
| NetworkStatus component behavior | Requires browser environment |

---

## 5. Manual Verification Checklist

For features that could not be automated due to browser tool unavailability, the following should be verified manually:

- [ ] Open `http://localhost:5173` — landing page loads
- [ ] Register a new student — form submits, redirects to `/complaints`
- [ ] Login as student — redirects to `/complaints`
- [ ] Submit a complaint with geolocation — location verification works
- [ ] View complaint history — list shows submitted complaints
- [ ] Click a complaint — details page shows action history
- [ ] Login as faculty — redirects to `/faculty`
- [ ] Faculty dashboard — shows all complaints with metrics
- [ ] Click a complaint as faculty — can assign, change status, add action
- [ ] Login as admin — redirects to `/admin`
- [ ] Admin dashboard — shows stats, recurring issues, follow-ups
- [ ] Navbar — shows correct links per role
- [ ] Logout — clears session, redirects to login
- [ ] Go offline (DevTools) — NetworkStatus banner appears
- [ ] Submit complaint while offline — stored in IndexedDB
- [ ] Go online — pending complaint syncs automatically
- [ ] Duplicate sync prevention — same `clientRequestId` returns existing complaint
- [ ] Responsive layout — test at mobile (375px) and desktop widths
- [ ] PWA install — app is installable from browser prompt

---

## 6. Summary

| Metric | Count |
|--------|-------|
| Integration tests executed | 40 |
| Tests passed | 40 |
| Tests failed | 0 |
| Tests blocked (browser) | 5 areas |
| Bugs fixed | 1 |
| Non-critical issues documented | 4 |
| Files changed | 1 (`client/src/pages/Login.jsx`) |
| Production build | ✅ Clean |
