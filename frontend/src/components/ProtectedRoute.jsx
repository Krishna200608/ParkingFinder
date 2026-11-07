import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Protects routes that require a logged-in user.
 * If user is not logged in, redirect to /login.
 */
const ProtectedRoute = () => {
  const { userInfo, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-gray-500 text-sm">
        Verifying session...
      </div>
    );
  }

  if (!userInfo) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export default ProtectedRoute;
