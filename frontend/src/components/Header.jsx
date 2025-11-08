import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Header = () => {
  const { userInfo, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <header className="bg-white shadow sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🚗</span>
          <div>
            <h1 className="text-xl font-semibold text-blue-600">ParkingFinder</h1>
            <p className="text-xs -mt-1 text-gray-500">Find & reserve parking near you</p>
          </div>
        </Link>

        <nav className="flex items-center gap-4">
          <Link to="/find" className="text-sm hover:text-blue-600 transition">
            Find Parking
          </Link>

          {!userInfo ? (
            <>
              <Link to="/login" className="text-sm hover:text-blue-600 transition">
                Login
              </Link>
              <Link
                to="/register"
                className="ml-2 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              {userInfo.role === "host" ? (
                <Link to="/host/dashboard" className="text-sm hover:text-blue-600 transition">
                  Host Dashboard
                </Link>
              ) : (
                <Link to="/dashboard" className="text-sm hover:text-blue-600 transition">
                  My Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="ml-2 bg-red-500 text-white px-3 py-2 rounded-md text-sm hover:bg-red-600 transition"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
