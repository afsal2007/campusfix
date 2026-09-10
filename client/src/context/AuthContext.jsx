/**
 * client/src/context/AuthContext.jsx
 *
 * Provides a simple authentication context to the whole app.
 *
 * - Stores the logged-in user in React state (and persists in localStorage).
 * - Exposes login(), logout(), and the current user object.
 * - Used by ProtectedRoute and any component that needs to know who is logged in.
 */

import React, { createContext, useContext, useState } from 'react';
import {
  setAuthToken,
  setStoredUser,
  clearAuthToken,
  getStoredUser,
} from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Restore user from localStorage on first load
  const [user, setUser] = useState(() => getStoredUser());

  /**
   * Call this after a successful login or register API response.
   * @param {string} token  - JWT received from backend
   * @param {object} userData - User object received from backend (no password)
   */
  const login = (token, userData) => {
    setAuthToken(token);
    setStoredUser(userData);
    setUser(userData);
  };

  /** Clear everything and redirect to login */
  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/** Hook — call inside any component to access auth state */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
};
