import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// This component checks if a user is logged in.
// If they are, it renders the child components (using <Outlet />).
// If not, it redirects them to the /login page.
const ProtectedRoute = () => {
  const { userInfo } = useAuth();

  return userInfo ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
