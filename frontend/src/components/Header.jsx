import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

/**
 * Modern Header
 * - Responsive (desktop / mobile)
 * - Role-aware links (driver / host / admin)
 * - CTA buttons: Find Parking, Become a Host / Add Spot
 * - User menu with Logout
 */

const Header = () => {
  const { userInfo, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false); // mobile menu
  const [openUser, setOpenUser] = useState(false); // user dropdown
  const userMenuRef = useRef();

  useEffect(() => {
    // close user dropdown on outside click
    const onDoc = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setOpenUser(false);
      }
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 text-white shadow">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13l4-4 4 4 4-4 4 4" />
                </svg>
              </div>

              <div>
                <h1 className="text-lg font-semibold text-slate-800">ParkingFinder</h1>
                <p className="text-xs text-slate-400 -mt-0.5">Find & reserve parking near you</p>
              </div>
            </Link>
          </div>

          {/* Middle: Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/find" className="text-sm text-slate-700 hover:text-blue-600 transition">
              Find Parking
            </Link>

            <Link to="/about" className="text-sm text-slate-700 hover:text-blue-600 transition">
              About
            </Link>

            <Link to="/pricing" className="text-sm text-slate-700 hover:text-blue-600 transition">
              Pricing
            </Link>

            <Link to="/contact" className="text-sm text-slate-700 hover:text-blue-600 transition">
              Contact
            </Link>
          </nav>

          {/* Right: CTAs / Auth */}
          <div className="flex items-center gap-3">
            {/* Become host / Add spot */}
            {!userInfo ? (
              <Link
                to="/register"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border border-slate-200 hover:shadow-sm transition"
              >
                Become a Host
              </Link>
            ) : userInfo.role === "host" || userInfo.role === "admin" ? (
              <Link
                to="/host/add-spot"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow hover:from-blue-700 transition"
              >
                + Add Spot
              </Link>
            ) : (
              <Link
                to="/register"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border border-slate-200 hover:shadow-sm transition"
              >
                Become a Host
              </Link>
            )}

            {/* Primary CTA */}
            <Link
              to="/find"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Find Parking
            </Link>

            {/* Auth / User */}
            {!userInfo ? (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm text-slate-700 hover:text-blue-600 transition">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="ml-2 inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setOpenUser((s) => !s)}
                  aria-expanded={openUser}
                  className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-100 transition"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                    {userInfo?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-sm font-medium text-slate-800">{userInfo?.username || "User"}</span>
                    <span className="text-xs text-slate-400">{userInfo?.role || "driver"}</span>
                  </div>
                </button>

                {/* User dropdown */}
                {openUser && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50">
                    <Link
                      to={userInfo.role === "host" ? "/host/dashboard" : "/dashboard"}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Dashboard
                    </Link>

                    {userInfo.role === "host" && (
                      <Link
                        to="/host/add-spot"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Add Spot
                      </Link>
                    )}

                    <Link to="/profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      Profile
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen((s) => !s)}
              className="md:hidden ml-2 p-2 rounded-md hover:bg-slate-100 transition"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 pt-4 pb-6 space-y-3">
            <Link to="/find" onClick={() => setOpen(false)} className="block text-slate-700 py-2">
              Find Parking
            </Link>
            <Link to="/about" onClick={() => setOpen(false)} className="block text-slate-700 py-2">
              About
            </Link>
            <Link to="/pricing" onClick={() => setOpen(false)} className="block text-slate-700 py-2">
              Pricing
            </Link>
            <Link to="/contact" onClick={() => setOpen(false)} className="block text-slate-700 py-2">
              Contact
            </Link>

            {!userInfo ? (
              <div className="pt-2">
                <Link to="/login" onClick={() => setOpen(false)} className="block font-medium py-2">
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="block mt-2 bg-blue-600 text-white text-center px-4 py-2 rounded"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="pt-2 space-y-1">
                <Link
                  to={userInfo.role === "host" ? "/host/dashboard" : "/dashboard"}
                  onClick={() => setOpen(false)}
                  className="block py-2"
                >
                  Dashboard
                </Link>
                {userInfo.role === "host" && (
                  <Link to="/host/add-spot" onClick={() => setOpen(false)} className="block py-2">
                    Add Spot
                  </Link>
                )}
                <button onClick={() => { setOpen(false); handleLogout(); }} className="w-full text-left py-2 text-rose-600">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
