import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  Car,
  Search,
  Plus,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Calendar,
  ChevronDown,
} from "lucide-react";

/**
 * Premium Header
 * Designed with Linear / Airbnb restraint:
 * - Subtle border bottom (#DDE3EA), clean white surface
 * - Clear active states, crisp typographic hierarchy
 * - Contextual role indicators without garish badge colors
 * - Accessible user dropdown and responsive mobile sheet
 */
export default function Header() {
  const { userInfo, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isMapPage = location.pathname === "/find";

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const navLinks = [
    { label: "Find Parking", path: "/find" },
    { label: "Pricing", path: "/pricing" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#DDE3EA] h-14 sm:h-16 flex items-center transition-colors">
      <div className={`w-full mx-auto px-4 sm:px-6 flex items-center justify-between ${isMapPage ? "max-w-none" : "max-w-7xl"}`}>
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md"
            aria-label="ParkingFinder Home"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0F172A] text-white flex items-center justify-center transition-colors group-hover:bg-blue-600">
              <Car size={18} strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-[#0F172A]">
                Parking<span className="text-blue-600">Finder</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive(item.path)
                    ? "bg-[#F4F6F8] text-blue-600 font-semibold"
                    : "text-[#334155] hover:text-[#0F172A] hover:bg-[#F4F6F8]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Action Stack */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search trigger (hidden on map page) */}
          {!isMapPage && (
            <Link
              to="/find"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#334155] hover:text-[#0F172A] hover:bg-[#F4F6F8] transition-colors border border-[#CBD5E1]"
            >
              <Search size={13} aria-hidden="true" />
              <span>Explore Map</span>
            </Link>
          )}

          {/* Role CTA */}
          {userInfo ? (
            userInfo.role === "host" || userInfo.role === "admin" ? (
              <Link
                to="/host/add-spot"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F4F6F8] transition-colors shadow-2xs"
              >
                <Plus size={14} className="text-blue-600" />
                <span>List Space</span>
              </Link>
            ) : (
              <Link
                to="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0F172A] hover:bg-[#F4F6F8] border border-[#CBD5E1] transition-colors shadow-2xs"
              >
                <Calendar size={13} className="text-blue-600" />
                <span>My Bookings</span>
              </Link>
            )
          ) : (
            <Link
              to="/register"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-[#334155] hover:text-[#0F172A] px-3 py-1.5"
            >
              Become a Host
            </Link>
          )}

          {/* Auth State */}
          {!userInfo ? (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-[#0F172A] px-3 py-1.5 hover:text-blue-600 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg shadow-2xs transition-colors"
              >
                Get Started
              </Link>
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#F4F6F8] border border-transparent hover:border-[#DDE3EA] transition-colors"
                aria-expanded={userDropdownOpen}
                aria-haspopup="true"
                aria-label="User Account Menu"
              >
                <div className="w-7 h-7 rounded-md bg-[#0F172A] text-white flex items-center justify-center text-xs font-semibold">
                  {userInfo.username?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-[#0F172A] leading-tight max-w-[110px] truncate">
                    {userInfo.username || "Account"}
                  </span>
                  <span className="text-[10px] text-[#475569] font-semibold capitalize">
                    {userInfo.role || "Driver"}
                  </span>
                </div>
                <ChevronDown size={14} className="text-[#475569]" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#DDE3EA] rounded-xl shadow-lg py-1.5 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-[#DDE3EA] bg-[#F8FAFC]">
                    <p className="font-semibold text-[#0F172A] truncate">{userInfo.username}</p>
                    <p className="text-[11px] text-[#475569] truncate">{userInfo.email}</p>
                  </div>

                  <Link
                    to={userInfo.role === "host" || userInfo.role === "admin" ? "/host/dashboard" : "/dashboard"}
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[#0F172A] hover:bg-[#F4F6F8] transition-colors"
                  >
                    <LayoutDashboard size={14} className="text-[#475569]" />
                    <span>{userInfo.role === "host" || userInfo.role === "admin" ? "Host Dashboard" : "Reservations"}</span>
                  </Link>

                  {userInfo.role === "host" && (
                    <Link
                      to="/host/add-spot"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-[#0F172A] hover:bg-[#F4F6F8] transition-colors"
                    >
                      <Plus size={14} className="text-[#475569]" />
                      <span>List New Space</span>
                    </Link>
                  )}

                  {userInfo.role === "driver" && (
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                    >
                      <Plus size={14} className="text-blue-600" />
                      <span>Become a Host</span>
                    </Link>
                  )}

                  <Link
                    to="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[#0F172A] hover:bg-[#F4F6F8] transition-colors"
                  >
                    <User size={14} className="text-[#475569]" />
                    <span>Account Settings</span>
                  </Link>

                  <div className="border-t border-[#DDE3EA] my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[#DC4545] hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-[#334155] hover:text-[#0F172A] hover:bg-[#F4F6F8]"
            aria-label="Toggle navigation drawer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Sheet */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 sm:top-16 bg-white border-b border-[#DDE3EA] shadow-xl p-4 space-y-3 z-40">
          <nav className="space-y-1">
            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(item.path)
                    ? "bg-[#F4F6F8] text-blue-600 font-semibold"
                    : "text-[#0F172A] hover:bg-[#F4F6F8]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-[#DDE3EA] pt-3">
            {userInfo ? (
              <div className="space-y-1">
                <Link
                  to={userInfo.role === "host" ? "/host/dashboard" : "/dashboard"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#F4F6F8] rounded-lg"
                >
                  {userInfo.role === "host" ? "Host Dashboard" : "My Bookings"}
                </Link>
                {userInfo.role === "host" && (
                  <Link
                    to="/host/add-spot"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#F4F6F8] rounded-lg"
                  >
                    + Add New Space
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-[#DC4545] hover:bg-red-50 rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 rounded-lg border border-[#DDE3EA] text-xs font-semibold text-[#0F172A]"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
