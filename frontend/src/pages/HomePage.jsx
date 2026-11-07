import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Car,
  MapPin,
  Clock,
  DollarSign,
  ShieldCheck,
  Zap,
  Star,
  Search,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const fadeIn = (delay = 0) => ({
  hidden: { opacity: 0, y: 25 },
  show: {
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.6, ease: "easeOut" },
  },
});

export default function HomePage() {
  const navigate = useNavigate();
  const [quickQuery, setQuickQuery] = useState("");
  const [activePersona, setActivePersona] = useState("driver"); // 'driver' | 'host'

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      navigate(`/find?search=${encodeURIComponent(quickQuery.trim())}`);
    } else {
      navigate("/find");
    }
  };

  const METRO_PRESETS = [
    { label: "Connaught Place, Delhi", query: "Connaught Place" },
    { label: "Aerocity Airport", query: "Aerocity" },
    { label: "Cyber City, Gurugram", query: "Cyber City" },
    { label: "Indiranagar, Bengaluru", query: "Indiranagar" },
    { label: "BKC, Mumbai", query: "Bandra Kurla Complex" },
    { label: "Manhattan, NYC", query: "Manhattan" },
  ];

  return (
    <div className="flex flex-col space-y-24 pb-20 overflow-hidden">
      {/* 🌇 GOOGLE STITCH HERO SECTION */}
      <section className="relative pt-12 pb-20 lg:pt-16 lg:pb-28 overflow-hidden">
        {/* Ambient Gradient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-blue-400/15 via-indigo-400/15 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Announcement Pill */}
          <motion.div
            variants={fadeIn(0.05)}
            initial="hidden"
            animate="show"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50/80 text-blue-700 border border-blue-200/60 shadow-xs mb-6 backdrop-blur-md"
          >
            <Sparkles size={14} className="text-blue-600 animate-spin-slow" />
            <span>Google Stitch UI 2.0 • Real-Time Urban Parking Marketplace</span>
          </motion.div>

          {/* Hero Display Typography */}
          <motion.h1
            variants={fadeIn(0.15)}
            initial="hidden"
            animate="show"
            className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.08] mb-6"
          >
            Find, Reserve & Park. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500">
              Guaranteed in Seconds.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeIn(0.25)}
            initial="hidden"
            animate="show"
            className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            A high-reliability two-sided mobility platform. Reserve prime parking bays with concurrency write locks, or monetize unused driveways with automated payments.
          </motion.p>

          {/* Hero Quick Search Box */}
          <motion.div
            variants={fadeIn(0.35)}
            initial="hidden"
            animate="show"
            className="max-w-2xl mx-auto mb-6"
          >
            <form
              onSubmit={handleHeroSearch}
              className="p-2 sm:p-2.5 rounded-2xl bg-white shadow-xl shadow-slate-200/50 border border-slate-200/80 flex flex-col sm:flex-row items-center gap-2 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all"
            >
              <div className="flex items-center gap-2.5 px-3 w-full">
                <MapPin className="text-blue-600 flex-shrink-0" size={20} />
                <input
                  type="text"
                  value={quickQuery}
                  onChange={(e) => setQuickQuery(e.target.value)}
                  placeholder="Enter destination, area, or metro landmark..."
                  className="w-full text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all flex-shrink-0"
              >
                <Search size={15} /> Find Spots
              </button>
            </form>

            {/* Quick Metro Presets */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-400 mr-1">Popular:</span>
              {METRO_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => navigate(`/find?search=${encodeURIComponent(preset.query)}`)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition text-[11px] font-medium"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Key Metrics Ribbon */}
          <motion.div
            variants={fadeIn(0.45)}
            initial="hidden"
            animate="show"
            className="pt-8 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {[
              { label: "Live Metro Hubs", value: "9+ Active", icon: MapPin },
              { label: "Booking Latency", value: "< 250ms", icon: Zap },
              { label: "Race-Condition Risk", value: "0% Locked", icon: Lock },
              { label: "Infrastructure Cost", value: "$0 Free Tier", icon: DollarSign },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col items-center"
                >
                  <Icon className="text-blue-600 mb-1" size={18} />
                  <p className="text-lg font-black text-slate-900">{stat.value}</p>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* 🌟 DUAL-PERSPECTIVE HOW IT WORKS (STITCH STEPPER) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Engineered for Both Sides of the Market
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Switch between driver reservation and host monetization workflows.
          </p>

          {/* Stepper Toggle */}
          <div className="inline-flex p-1 bg-slate-100 rounded-full border border-slate-200/80 mt-5">
            <button
              onClick={() => setActivePersona("driver")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                activePersona === "driver"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Car size={14} /> For Drivers
            </button>
            <button
              onClick={() => setActivePersona("host")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                activePersona === "host"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <DollarSign size={14} /> For Space Hosts
            </button>
          </div>
        </div>

        {/* Step Cards */}
        {activePersona === "driver" ? (
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Locate on Map",
                desc: "Search by address or GPS with real-time distance calculations and amenity filters.",
                icon: MapPin,
              },
              {
                step: "02",
                title: "Select Exact Slot",
                desc: "Dynamic availability timelines display unoccupied hours without double-booking.",
                icon: Clock,
              },
              {
                step: "03",
                title: "Secure Reservation",
                desc: "Atomic locks write your reservation. Choose demo booking or Stripe test checkout.",
                icon: Lock,
              },
              {
                step: "04",
                title: "Park & Review",
                desc: "Follow instant directions and unlock verified review gating once your booking completes.",
                icon: Star,
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-200 relative group"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-black text-slate-200 group-hover:text-blue-500 transition-colors">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Icon size={18} />
                    </div>
                  </div>
                  <h3 className="font-bold text-base text-slate-800 mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "List Your Space",
                desc: "Enter your address, upload spot photos, select vehicle sizes, and declare amenities.",
                icon: MapPin,
              },
              {
                step: "02",
                title: "Set Hourly Rates",
                desc: "Use base pricing or consult the Dynamic Pricing model to optimize peak yields.",
                icon: TrendingUp,
              },
              {
                step: "03",
                title: "Manage Bookings",
                desc: "Incoming reservations appear in real-time with driver identity and duration details.",
                icon: ShieldCheck,
              },
              {
                step: "04",
                title: "One-Click Controls",
                desc: "Toggle listing availability anytime or inspect total aggregated earnings.",
                icon: CheckCircle2,
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-200 relative group"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-black text-slate-200 group-hover:text-indigo-500 transition-colors">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Icon size={18} />
                    </div>
                  </div>
                  <h3 className="font-bold text-base text-slate-800 mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 🚀 BENTO GRID ARCHITECTURE HIGHLIGHTS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
            Under the Hood
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
            Core Architectural Differentiators
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Bento Card 1: Concurrency Safety */}
          <div className="bg-gradient-to-br from-white to-blue-50/50 p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-5 shadow-md shadow-blue-500/20">
                <Lock size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Atomic Write Lock Concurrency
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Simultaneous booking requests execute with transactional document versioning and half-open interval checks:
              </p>
              <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-blue-700">
                [RequestedStart, RequestedEnd)
              </div>
            </div>
            <p className="text-[11px] font-semibold text-blue-600 mt-6 flex items-center gap-1">
              Guaranteed Zero Double-Bookings
            </p>
          </div>

          {/* Bento Card 2: Dynamic Pricing Simulator */}
          <div className="bg-gradient-to-br from-white to-amber-50/50 p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mb-5 shadow-md shadow-amber-500/20">
                <TrendingUp size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Dynamic Pricing Engine
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Algorithmic pricing balances demand, time of day, and special event surges using a 3-factor simulator:
              </p>
              <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-amber-700">
                P_sim = P_base × (1 + αD + βT + γE)
              </div>
            </div>
            <Link
              to="/pricing"
              className="text-[11px] font-bold text-amber-600 mt-6 flex items-center gap-1 hover:underline"
            >
              Launch Interactive Simulator →
            </Link>
          </div>

          {/* Bento Card 3: Demand Heatmap */}
          <div className="bg-gradient-to-br from-white to-indigo-50/50 p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-5 shadow-md shadow-indigo-500/20">
                <Layers size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Geospatial Demand Heatmap
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Interactive Leaflet overlay visualizes real-time parking density and occupancy pressure across urban zones.
              </p>
              <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-indigo-700">
                GET /api/spots/demand-heatmap
              </div>
            </div>
            <Link
              to="/find"
              className="text-[11px] font-bold text-indigo-600 mt-6 flex items-center gap-1 hover:underline"
            >
              View Live Heatmap Overlay →
            </Link>
          </div>
        </div>
      </section>

      {/* ⭐ VERIFIED REVIEWS CAROUSEL */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Trusted by Urban Commuters
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Verified ratings collected exclusively after completed parking sessions.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Rahul Verma",
              role: "Daily Commuter, Gurugram",
              quote: "The Indiranagar EV spot had my car fully charged before my client meeting ended. Flawless reservation flow.",
              rating: 5,
            },
            {
              name: "Priya Nair",
              role: "Driveway Host, New Delhi",
              quote: "Monetizing my empty Hauz Khas spot brings steady income while I am at work. The host dashboard is super clean.",
              rating: 5,
            },
            {
              name: "David Chen",
              role: "Visitor, Manhattan NYC",
              quote: "Finding Midtown Manhattan parking for $35/hr without surprise valet fees was a lifesaver. Instant Stripe receipt.",
              rating: 5,
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-1 text-amber-400 mb-3">
                  {[...Array(item.rating)].map((_, idx) => (
                    <Star key={idx} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic mb-4">
                  "{item.quote}"
                </p>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-bold text-slate-800">{item.name}</p>
                <p className="text-[11px] text-slate-400">{item.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🚀 HIGH-CONVERTING BOTTOM CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-8 sm:p-12 text-center shadow-2xl overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Ready to park without the hassle?
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm">
              Discover active spots near your destination right now or start earning as an urban space host in under two minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Link
                to="/find"
                className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
              >
                <Search size={15} /> Open Discovery Map
              </Link>
              <Link
                to="/register"
                className="bg-blue-700/60 hover:bg-blue-700 border border-blue-400/40 text-white font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
              >
                Become a Host <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Decorative Background Elements */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-10 -top-10 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />
        </div>
      </section>
    </div>
  );
}
