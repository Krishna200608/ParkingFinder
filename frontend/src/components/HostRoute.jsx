import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Protects routes that require a host account.
 * If not logged in or not a host, redirect to /login or /dashboard.
 */
const HostRoute = () => {
  const { userInfo } = useAuth();

  if (!userInfo) return <Navigate to="/login" replace />;

  // if user is logged in but not a host, redirect to driver dashboard
  if (userInfo.role !== "host") return <Navigate to="/dashboard" replace />;

  return <Outlet />;
};

export default HostRoute;
