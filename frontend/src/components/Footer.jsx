import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Car, Github, ArrowUpRight } from "lucide-react";

export default function Footer() {
  const location = useLocation();

  // Hide footer completely on map page to maximize viewport
  if (location.pathname === "/find") {
    return null;
  }

  // Render minimal single-line footer on authentication pages
  if (location.pathname === "/login" || location.pathname === "/register") {
    return (
      <footer className="bg-white border-t border-[#DDE3EA] py-4 text-xs text-[#475569] mt-auto">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <p>© {new Date().getFullYear()} ParkingFinder. Urban mobility marketplace.</p>
          <div className="flex items-center gap-4 text-[#475569]">
            <Link to="/about" className="hover:text-[#0F172A]">About</Link>
            <span>•</span>
            <Link to="/pricing" className="hover:text-[#0F172A]">Pricing</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-[#0F172A]">Support</Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-white border-t border-[#DDE3EA] text-[#475569] text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-10 border-b border-[#DDE3EA]">
          {/* Brand & Mission */}
          <div className="col-span-2 space-y-3">
            <Link to="/" className="inline-flex items-center gap-2 text-[#0F172A]">
              <div className="w-6 h-6 rounded bg-[#0F172A] text-white flex items-center justify-center">
                <Car size={14} />
              </div>
              <span className="font-bold text-sm tracking-tight">
                Parking<span className="text-blue-600">Finder</span>
              </span>
            </Link>
            <p className="text-xs text-[#334155] max-w-sm leading-relaxed">
              An urban mobility marketplace connecting drivers with verified parking spaces and local property hosts. Built with open-source engineering standards.
            </p>
            <p className="text-[11px] text-[#475569]">
              MIT License • Full-stack MERN & Vercel deployment.
            </p>
          </div>

          {/* Drivers */}
          <div className="space-y-2.5">
            <p className="font-semibold text-[#0F172A] uppercase tracking-wider text-[11px]">
              Drivers
            </p>
            <ul className="space-y-2">
              <li>
                <Link to="/find" className="hover:text-[#0F172A] transition-colors">
                  Find Parking
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-[#0F172A] transition-colors">
                  Pricing Simulator
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-[#0F172A] transition-colors">
                  My Reservations
                </Link>
              </li>
            </ul>
          </div>

          {/* Hosts */}
          <div className="space-y-2.5">
            <p className="font-semibold text-[#0F172A] uppercase tracking-wider text-[11px]">
              Hosts
            </p>
            <ul className="space-y-2">
              <li>
                <Link to="/register" className="hover:text-[#0F172A] transition-colors">
                  List a Space
                </Link>
              </li>
              <li>
                <Link to="/host/dashboard" className="hover:text-[#0F172A] transition-colors">
                  Host Dashboard
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#0F172A] transition-colors">
                  How Hosting Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & Resources */}
          <div className="space-y-2.5">
            <p className="font-semibold text-[#0F172A] uppercase tracking-wider text-[11px]">
              Platform
            </p>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="hover:text-[#0F172A] transition-colors">
                  About Project
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#0F172A] transition-colors">
                  Support & Contact
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/Krishna200608/ParkingFinder"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-[#0F172A] transition-colors"
                >
                  <Github size={13} />
                  <span>GitHub Repository</span>
                  <ArrowUpRight size={11} className="text-[#475569]" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#475569]">
          <p>© {new Date().getFullYear()} ParkingFinder. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-[#0F172A]">Architecture</Link>
            <span>•</span>
            <Link to="/pricing" className="hover:text-[#0F172A]">Rates</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-[#0F172A]">Help</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
