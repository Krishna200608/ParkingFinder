import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  Car,
  Search,
  PlusCircle,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

/**
 * Google Stitch Header
 * - Glassmorphic backdrop with ambient boundary line
 * - Active route indicators with smooth pill transitions
 * - Role-aware host/driver indicators
 * - Quick Search action
 */
const Header = () => {
  const { userInfo, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false); // mobile drawer
  const [openUser, setOpenUser] = useState(false); // user menu
  const userMenuRef = useRef();

  useEffect(() => {
    const onDocClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setOpenUser(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const navLinks = [
    { label: "Find Parking", path: "/find" },
    { label: "My Bookings", path: "/dashboard", authRequired: true },
    { label: "Dynamic Pricing", path: "/pricing" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 border-b border-slate-200/70 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <Car size={22} strokeWidth={2.3} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                    Parking<span className="text-blue-600">Finder</span>
                  </span>
                  <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                    v2.0
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-400 -mt-1 hidden sm:block">
                  Smart Urban Discovery & Booking
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 p-1 rounded-full border border-slate-200/50">
            {navLinks.map((item) => {
              if (item.authRequired && !userInfo) return null;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                    isActive(item.path)
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Stack */}
          <div className="flex items-center gap-2.5">
            {/* Quick Find Shortcut Button */}
            <Link
              to="/find"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition"
              title="Search Map"
            >
              <Search size={14} /> Quick Search
            </Link>

            {/* Role-Specific Actions */}
            {!userInfo ? (
              <Link
                to="/register"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
              >
                Become a Host
              </Link>
            ) : userInfo.role === "host" || userInfo.role === "admin" ? (
              <Link
                to="/host/add-spot"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition shadow-xs"
              >
                <PlusCircle size={14} /> List New Spot
              </Link>
            ) : null}

            {/* Auth Buttons or User Avatar */}
            {!userInfo ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm shadow-blue-500/20 hover:shadow-md transition-all"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setOpenUser((s) => !s)}
                  aria-expanded={openUser}
                  className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100/80 transition border border-transparent hover:border-slate-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                    {userInfo?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      {userInfo?.username || "Driver"}
                    </span>
                    <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                      {userInfo?.role || "driver"}
                    </span>
                  </div>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {openUser && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-1.5 z-50 animate-slideUp overflow-hidden">
                    <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-xs font-bold text-slate-800">{userInfo?.username}</p>
                      <p className="text-[11px] text-slate-400 truncate">{userInfo?.email}</p>
                    </div>

                    <Link
                      to={userInfo.role === "host" || userInfo.role === "admin" ? "/host/dashboard" : "/dashboard"}
                      onClick={() => setOpenUser(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                    >
                      <LayoutDashboard size={15} />
                      {userInfo.role === "host" || userInfo.role === "admin"
                        ? "Host Dashboard"
                        : "Driver Reservations"}
                    </Link>

                    {userInfo.role === "host" && (
                      <Link
                        to="/host/add-spot"
                        onClick={() => setOpenUser(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                      >
                        <PlusCircle size={15} /> Add Space Listing
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      onClick={() => setOpenUser(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                    >
                      <User size={15} /> Profile Settings
                    </Link>

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={() => {
                        setOpenUser(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setOpen((s) => !s)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              aria-label="Toggle navigation menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-2 animate-fadeIn">
          {navLinks.map((item) => {
            if (item.authRequired && !userInfo) return null;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 rounded-xl text-sm font-semibold transition ${
                  isActive(item.path)
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="border-t border-slate-100 pt-3">
            {!userInfo ? (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="text-center py-2.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="text-center py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                <Link
                  to={userInfo.role === "host" ? "/host/dashboard" : "/dashboard"}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-sm font-semibold text-slate-800"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-rose-600"
                >
                  Sign Out
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
