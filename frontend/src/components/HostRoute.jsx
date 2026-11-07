import React, { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

/**
 * Protects routes that require a host account.
 * If not logged in or not a host, notify and redirect to /login or /dashboard.
 */
const HostRoute = () => {
  const { userInfo, loading } = useAuth();

  useEffect(() => {
    if (!loading && userInfo && userInfo.role !== "host" && userInfo.role !== "admin") {
      toast.error("Host permissions required to access listing tools. You can activate Host status in your Profile.");
    }
  }, [loading, userInfo]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-gray-500 text-sm">
        Verifying session...
      </div>
    );
  }

  if (!userInfo) return <Navigate to="/login" replace />;

  // if user is logged in but neither host nor admin, redirect to driver dashboard
  if (userInfo.role !== "host" && userInfo.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default HostRoute;
