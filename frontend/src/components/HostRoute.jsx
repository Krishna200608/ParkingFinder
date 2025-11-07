import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// This component protects routes that should only be accessible
// to users with the 'host' role.
const HostRoute = () => {
  const { userInfo } = useAuth();

  // Check if user is logged in AND if their role is 'host'
  return userInfo && userInfo.role === 'host' ? (
    <Outlet />
  ) : (
    // If not a host, redirect to home page or a 'not-authorized' page
    <Navigate to="/" replace />
  );
};

export default HostRoute;