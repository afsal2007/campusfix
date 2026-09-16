/**
 * client/src/services/api.js
 *
 * Centralised axios instance for all CampusFix API requests.
 *
 * - Base URL is read from the VITE_API_URL environment variable.
 * - An axios request interceptor automatically attaches the JWT stored in
 *   localStorage so every protected call has the Authorization header.
 */

import axios from 'axios';

// Read base URL from environment (set in .env at the client root)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor ───────────────────────────────────────────────────────
// Attach JWT to every outgoing request if one is stored in localStorage.
// Components and pages never need to manually add the Authorization header.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campusfix_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Convenience helpers ───────────────────────────────────────────────────────

/** Store the token after login/register */
export const setAuthToken = (token) => {
  localStorage.setItem('campusfix_token', token);
};

/** Remove the token on logout */
export const clearAuthToken = () => {
  localStorage.removeItem('campusfix_token');
  localStorage.removeItem('campusfix_user');
};

/** Check whether a token exists */
export const isAuthenticated = () => {
  return !!localStorage.getItem('campusfix_token');
};

/** Get stored user object (or null) */
export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('campusfix_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/** Persist user object after login/register */
export const setStoredUser = (user) => {
  localStorage.setItem('campusfix_user', JSON.stringify(user));
};

/** Fetch a single complaint by ID */
export const getComplaintById = async (id) => {
  const response = await api.get(`/complaints/${id}`);
  return response.data;
};

/** Fetch all complaints (Faculty/Admin only) */
export const getAllComplaints = async () => {
  const response = await api.get('/complaints');
  return response.data;
};

export default api;

