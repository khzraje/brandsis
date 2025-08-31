import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const auth = useAuth();
  if (auth.isInitializing) {
    // don't redirect while we restore session
    return null;
  }
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
