/**
 * client/src/App.jsx
 *
 * Root application component with routing.
 * Day 1 / Day 2 / Day 3 functionality is preserved — all existing features
 * remain intact. Day 4 adds complaint routes and the AuthProvider wrapper.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ComplaintForm from './pages/ComplaintForm.jsx';
import MyComplaints from './pages/MyComplaints.jsx';
import ComplaintDetails from './pages/ComplaintDetails.jsx';
import FacultyDashboard from './pages/FacultyDashboard.jsx';
import './App.css';

// ── Nav bar ──────────────────────────────────────────────────────────────────
const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__brand">CampusFix</Link>
      <div className="navbar__links">
        {user ? (
          <>
            {user.role === 'student' ? (
              <>
                <Link to="/complaints" className="navbar__link">My Complaints</Link>
                <Link to="/complaints/new" className="navbar__link">Report Issue</Link>
              </>
            ) : (
              <Link to="/faculty" className="navbar__link">Faculty Dashboard</Link>
            )}
            <span className="navbar__user">Hi, {user.name.split(' ')[0]}</span>
            <button className="btn-logout" onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar__link">Login</Link>
            <Link to="/register" className="navbar__link navbar__link--accent">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

// ── Home / landing page ──────────────────────────────────────────────────────
const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <div className="hero">
        <div className="badge">Campus Complaint Management System</div>
        <h1>CampusFix</h1>
        <p className="hero-subtitle">
          Report campus issues, track their resolution, and keep your campus running smoothly.
        </p>
        <div className="hero-actions">
          {user ? (
            <>
              <Link to="/complaints/new" className="btn-primary btn-lg">Report an Issue</Link>
              <Link to="/complaints" className="btn-secondary btn-lg">View My Complaints</Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-primary btn-lg">Sign In</Link>
              <Link to="/register" className="btn-secondary btn-lg">Create Account</Link>
            </>
          )}
        </div>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <span className="feature-icon">📋</span>
          <h3>Submit Complaints</h3>
          <p>Report any campus issue — technical, infrastructure, cleanliness, and more.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">🔍</span>
          <h3>Track Progress</h3>
          <p>Follow up on your complaints and see their current status in real time.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">📍</span>
          <h3>Location Aware</h3>
          <p>Tag the exact campus location so the right team can respond quickly.</p>
        </div>
      </div>
    </div>
  );
};

// ── App with router ──────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Navbar />
          <main className="app-main">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes — redirect to /login if unauthenticated */}
              <Route
                path="/complaints/new"
                element={
                  <ProtectedRoute>
                    <ComplaintForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/complaints"
                element={
                  <ProtectedRoute>
                    <MyComplaints />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/complaints/:id"
                element={
                  <ProtectedRoute>
                    <ComplaintDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/faculty"
                element={
                  <ProtectedRoute allowedRoles={['faculty', 'admin']}>
                    <FacultyDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="app-footer">
            <p>CampusFix V1 &bull; Student Campus Issue Reporting</p>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

