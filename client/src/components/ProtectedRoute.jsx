/**
 * client/src/components/ProtectedRoute.jsx
 *
 * Wraps any route that requires authentication.
 * Unauthenticated users are redirected to /login.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
