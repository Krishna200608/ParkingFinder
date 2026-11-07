import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Protects routes that require a host account.
 * If not logged in or not a host, redirect to /login or /dashboard.
 */
const HostRoute = () => {
  const { userInfo, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-gray-500 text-sm">
        Verifying session...
      </div>
    );
  }

  if (!userInfo) return <Navigate to="/login" replace />;

  // if user is logged in but neither host nor admin, redirect to driver dashboard
  if (userInfo.role !== "host" && userInfo.role !== "admin") return <Navigate to="/dashboard" replace />;

  return <Outlet />;
};

export default HostRoute;
