import React from "react";
import { Link } from "react-router-dom";
import {
  Car,
  ShieldCheck,
  Github,
  Twitter,
  Linkedin,
  Heart,
  ExternalLink,
  Zap,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Car size={22} strokeWidth={2.4} />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                Parking<span className="text-blue-500">Finder</span>
              </span>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Next-generation two-sided urban parking marketplace. Powered by atomic concurrency write locks, OpenStreetMap geospatial discovery, algorithmic dynamic pricing, and zero-cost serverless infrastructure.
            </p>

            {/* Platform Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-300 font-medium text-[11px]">
                Platform Status: <strong className="text-emerald-400 font-semibold">Operational (Vercel Edge)</strong>
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Product</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/find" className="hover:text-white transition">
                  Find Parking
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-white transition flex items-center gap-1">
                  Pricing Simulator <Zap size={12} className="text-amber-400" />
                </Link>
              </li>
              <li>
                <Link to="/find" className="hover:text-white transition">
                  Demand Heatmap
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition">
                  My Reservations
                </Link>
              </li>
            </ul>
          </div>

          {/* For Hosts Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">For Hosts</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/register" className="hover:text-white transition">
                  List Your Space
                </Link>
              </li>
              <li>
                <Link to="/host/dashboard" className="hover:text-white transition">
                  Host Dashboard
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition">
                  Host Protection Policy
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">
                  Commercial Fleet Inquiries
                </Link>
              </li>
            </ul>
          </div>

          {/* Technology & Open Source */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Architecture</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a
                  href="https://github.com/Krishna200608/ParkingFinder"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition flex items-center gap-1.5"
                >
                  <Github size={13} /> GitHub Repository <ExternalLink size={10} />
                </a>
              </li>
              <li className="text-[11px] text-slate-500">React 19 & Vite 7</li>
              <li className="text-[11px] text-slate-500">Node.js & Express API</li>
              <li className="text-[11px] text-slate-500">MongoDB Atlas Replica Set</li>
              <li className="text-[11px] text-slate-500">Stripe Test Mode Gateway</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ParkingFinder. Released under the MIT License.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Crafted with <Heart size={12} className="text-rose-500 fill-rose-500" /> for Urban Drivers
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
