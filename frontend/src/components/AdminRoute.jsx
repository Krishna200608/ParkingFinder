import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * Route protection wrapper requiring verified administrator credentials.
 * Redirects unauthorized requests to /login or /dashboard.
 */
const AdminRoute = () => {
  const { userInfo, loading } = useAuth();

  useEffect(() => {
    if (!loading && userInfo && userInfo.role !== 'admin') {
      toast.error('Administrative access restricted. Redirecting to your dashboard.');
    }
  }, [loading, userInfo]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-slate-500 text-sm font-medium">
        Verifying administrative authorization...
      </div>
    );
  }

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  if (userInfo.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
