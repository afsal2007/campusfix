import React from 'react';
import './App.css';

function App() {
  return (
    <div className="container">
      <header className="header">
        <div className="badge">Day 1 Development Foundation</div>
        <h1>CampusFix</h1>
        <p className="subtitle">Campus Complaint Management System</p>
      </header>

      <main className="card">
        <h2>System Status</h2>
        <ul className="status-list">
          <li className="status-item">
            <span className="check">✓</span>
            <div>
              <strong>Frontend Configured</strong>
              <p>React + Vite, React Router, Axios, Dexie.js</p>
            </div>
          </li>
          <li className="status-item">
            <span className="check">✓</span>
            <div>
              <strong>Backend Configured</strong>
              <p>Node.js, Express, ES Modules, REST Health Endpoint</p>
            </div>
          </li>
          <li className="status-item">
            <span className="check">✓</span>
            <div>
              <strong>PWA Foundation Configured</strong>
              <p>VitePWA integration & service worker scaffolding</p>
            </div>
          </li>
          <li className="status-item">
            <span className="check">✓</span>
            <div>
              <strong>Project Structure Ready</strong>
              <p>Modular client/server architecture with complete docs</p>
            </div>
          </li>
        </ul>

        <div className="info-box">
          <p>
            <strong>Backend API:</strong> <code>http://localhost:5000/</code>
          </p>
          <p>
            <strong>Status:</strong> Ready for Day 2 Development
          </p>
        </div>
      </main>

      <footer className="footer">
        <p>CampusFix V1 &bull; Offline-First &bull; Location-Aware</p>
      </footer>
    </div>
  );
}

export default App;
