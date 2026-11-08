import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Car,
  MapPin,
  Clock,
  DollarSign,
  ShieldCheck,
  Search,
  ArrowRight,
  Lock,
  Layers,
  TrendingUp,
  CheckCircle2,
  CalendarCheck,
  X,
} from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { userInfo, login } = useAuth();
  const navigate = useNavigate();
  const [quickQuery, setQuickQuery] = useState("");
  const [activePersona, setActivePersona] = useState("driver"); // 'driver' | 'host'
  const [showHostUpgradeModal, setShowHostUpgradeModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      navigate(`/find?search=${encodeURIComponent(quickQuery.trim())}`);
    } else {
      navigate("/find");
    }
  };

  const handleListSpaceClick = () => {
    if (!userInfo) {
      navigate("/register");
      return;
    }
    if (userInfo.role === "host" || userInfo.role === "admin") {
      navigate("/host/add-spot");
      return;
    }
    // Authenticated Driver -> Prompt with upgrade modal
    setShowHostUpgradeModal(true);
  };

  const handleUpgradeToHost = async () => {
    try {
      setIsUpgrading(true);
      const { data } = await axios.post(
        "/api/auth/switch-role",
        { role: "host" },
        { withCredentials: true }
      );
      if (data?.user) {
        login(data);
        toast.success(data.message || "Host account activated! Welcome to the space host marketplace.");
        setShowHostUpgradeModal(false);
        navigate("/host/add-spot");
      }
    } catch (err) {
      console.error("Upgrade error:", err);
      if (err?.response?.status === 401) {
        toast.error("Your session has expired. Please sign in again.");
        setShowHostUpgradeModal(false);
        navigate("/login");
      } else {
        toast.error(err?.response?.data?.message || "Failed to activate host account");
      }
    } finally {
      setIsUpgrading(false);
    }
  };

  const METRO_PRESETS = [
    { label: "Connaught Place, Delhi", query: "Connaught Place" },
    { label: "Aerocity, Airport Hub", query: "Aerocity" },
    { label: "Cyber City, Gurugram", query: "Cyber City" },
    { label: "Indiranagar, Bengaluru", query: "Indiranagar" },
    { label: "BKC, Mumbai", query: "Bandra Kurla Complex" },
    { label: "Manhattan, New York", query: "Manhattan" },
  ];

  return (
    <div className="flex flex-col space-y-16 sm:space-y-24 pb-16">
      {/* ── 1. EDITORIAL HERO SECTION ──────────────────────────── */}
      <section className="pt-8 sm:pt-14 pb-10 border-b border-[#DDE3EA] bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            <span>Urban Parking Marketplace</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-[#0F172A] tracking-tight leading-[1.12] mb-5">
            Reliable urban parking, <br className="hidden sm:inline" />
            <span className="text-[#2563EB]">reserved before you arrive.</span>
          </h1>

          <p className="text-[#334155] text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
            Connect directly with verified parking space hosts. Reserve guaranteed bays
            with strict concurrency protection or monetize your idle driveway.
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto mb-4">
            <form
              onSubmit={handleHeroSearch}
              className="p-1.5 sm:p-2 rounded-xl bg-white border border-[#DDE3EA] shadow-xs flex flex-col sm:flex-row items-center gap-2 focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-blue-100 transition-all"
            >
              <div className="flex items-center gap-2.5 px-3 w-full">
                <MapPin className="text-[#2563EB] shrink-0" size={18} />
                <input
                  type="text"
                  value={quickQuery}
                  onChange={(e) => setQuickQuery(e.target.value)}
                  placeholder="Enter destination, landmark, or district..."
                  className="w-full text-sm text-[#0F172A] placeholder-[#64748B] focus:outline-none bg-transparent py-1.5"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full sm:w-auto shrink-0"
              >
                <Search size={15} />
                <span>Search Spaces</span>
              </Button>
            </form>

            {/* Quick Metro Presets */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-xs text-[#475569]">
              <span className="font-semibold text-[#475569] mr-1">Popular hubs:</span>
              {METRO_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => navigate(`/find?search=${encodeURIComponent(preset.query)}`)}
                  className="px-2.5 py-1 rounded-md bg-[#F4F6F8] hover:bg-blue-50 hover:text-[#2563EB] border border-transparent hover:border-blue-200 text-[#334155] transition text-xs font-medium cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. DUAL-SIDED MARKETPLACE WORKFLOWS ────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#DDE3EA] gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
              Designed for drivers and space hosts
            </h2>
            <p className="text-sm text-[#334155] mt-1">
              Select your role to explore the streamlined journey from search to payout.
            </p>
          </div>

          {/* Stepper Toggle */}
          <div className="inline-flex p-1 bg-[#F1F5F9] rounded-lg border border-[#E2E8F0] shrink-0">
            <button
              onClick={() => setActivePersona("driver")}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                activePersona === "driver"
                  ? "bg-white text-[#2563EB] shadow-2xs font-semibold"
                  : "text-[#475569] hover:text-[#0F172A]"
              }`}
            >
              <Car size={14} /> For Drivers
            </button>
            <button
              onClick={() => setActivePersona("host")}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                activePersona === "host"
                  ? "bg-white text-[#2563EB] shadow-2xs font-semibold"
                  : "text-[#475569] hover:text-[#0F172A]"
              }`}
            >
              <DollarSign size={14} /> For Hosts
            </button>
          </div>
        </div>

        {/* Step Cards */}
        {activePersona === "driver" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: "01",
                title: "Locate on Map",
                desc: "Discover real-time parking spaces by address or GPS with distance calculations and amenity filters.",
                icon: MapPin,
              },
              {
                step: "02",
                title: "Select Exact Window",
                desc: "Availability timeline shows open hours without conflicting with existing booked slots.",
                icon: Clock,
              },
              {
                step: "03",
                title: "Atomic Lock Reservation",
                desc: "Reservations lock concurrency-safe intervals. Choose instant sandbox test or Stripe checkout.",
                icon: Lock,
              },
              {
                step: "04",
                title: "Park & Review",
                desc: "Get directions, monitor your active booking, and submit verified reviews upon session completion.",
                icon: CalendarCheck,
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <Card key={i} className="flex flex-col justify-between" padding="default">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-mono font-bold text-[#475569]">
                        {item.step}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-[#F4F6F8] border border-[#DDE3EA] text-[#2563EB] flex items-center justify-center">
                        <Icon size={16} />
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm text-[#0F172A] mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#334155] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: "01",
                title: "List Your Space",
                desc: "Specify exact address, vehicle size limits, pricing, and available amenities like EV charging or CCTV.",
                icon: MapPin,
              },
              {
                step: "02",
                title: "Set Hourly Rates",
                desc: "Define base hourly pricing or use the dynamic pricing simulator to calculate peak demand yield.",
                icon: TrendingUp,
              },
              {
                step: "03",
                title: "Receive Bookings",
                desc: "Track reservations in real-time on your host dashboard with driver information and schedules.",
                icon: ShieldCheck,
              },
              {
                step: "04",
                title: "Manage Availability",
                desc: "Toggle your space online or offline at any time with instantaneous marketplace updates.",
                icon: CheckCircle2,
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <Card key={i} className="flex flex-col justify-between" padding="default">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-mono font-bold text-[#475569]">
                        {item.step}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-[#F4F6F8] border border-[#DDE3EA] text-[#2563EB] flex items-center justify-center">
                        <Icon size={16} />
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm text-[#0F172A] mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#334155] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 3. CORE ARCHITECTURAL DIFFERENTIATORS ───────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <div className="mb-8">
          <Badge variant="brand" size="sm" className="mb-2">
            Platform Capabilities
          </Badge>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
            Engineered for high reliability and market efficiency
          </h2>
          <p className="text-sm text-[#334155] mt-1">
            Built on mathematically verified booking intervals, geospatial queries, and transparent algorithmic pricing.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {/* Feature 1: Atomic Concurrency */}
          <Card className="flex flex-col justify-between" padding="lg">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center mb-4">
                <Lock size={18} />
              </div>
              <h3 className="text-base font-semibold text-[#0F172A] mb-2">
                Concurrency Protection
              </h3>
              <p className="text-xs text-[#334155] leading-relaxed mb-4">
                Concurrent booking requests evaluate against half-open temporal intervals to prevent duplicate occupancy:
              </p>
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-xs text-[#2563EB]">
                [start_time, end_time)
              </div>
            </div>
            <p className="text-xs font-medium text-[#16845B] mt-5 flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Strict interval isolation
            </p>
          </Card>

          {/* Feature 2: Dynamic Pricing Simulator */}
          <Card className="flex flex-col justify-between" padding="lg">
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 text-[#D97706] flex items-center justify-center mb-4">
                <TrendingUp size={18} />
              </div>
              <h3 className="text-base font-semibold text-[#0F172A] mb-2">
                Dynamic Pricing Engine
              </h3>
              <p className="text-xs text-[#334155] leading-relaxed mb-4">
                Simulates real-time rate adjustments based on base price, local occupancy density, and peak hours:
              </p>
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-xs text-[#D97706]">
                P = P_base × (1 + α·D + β·T)
              </div>
            </div>
            <Link
              to="/pricing"
              className="text-xs font-semibold text-[#2563EB] mt-5 flex items-center gap-1 hover:underline"
            >
              Explore Pricing Simulator <ArrowRight size={13} />
            </Link>
          </Card>

          {/* Feature 3: Demand Heatmap */}
          <Card className="flex flex-col justify-between" padding="lg">
            <div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Layers size={18} />
              </div>
              <h3 className="text-base font-semibold text-[#0F172A] mb-2">
                Geospatial Demand Heatmap
              </h3>
              <p className="text-xs text-[#334155] leading-relaxed mb-4">
                Visualizes high-occupancy hotspots directly on OpenStreetMap, enabling drivers to plan ahead:
              </p>
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-xs text-indigo-700">
                GET /api/spots/demand-heatmap
              </div>
            </div>
            <Link
              to="/find"
              className="text-xs font-semibold text-[#2563EB] mt-5 flex items-center gap-1 hover:underline"
            >
              View Discovery Map <ArrowRight size={13} />
            </Link>
          </Card>
        </div>
      </section>

      {/* ── 4. HOST MONETIZATION HIGHLIGHT ─────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <Card variant="dark" className="bg-[#0F172A] text-white border-slate-700" padding="lg">
          <div className="max-w-2xl">
            <Badge variant="neutral" size="sm" className="bg-slate-800 text-slate-200 border-slate-700 mb-3">
              For Property & Driveway Owners
            </Badge>
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight mb-3 text-white">
              Turn your unused parking space into predictable monthly income
            </h2>
            <p className="text-slate-200 text-sm leading-relaxed mb-6 font-normal">
              Listing takes less than two minutes. Set your own rules, accept reservations
              automatically, and manage availability through our dedicated host portal.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={handleListSpaceClick}
                className="bg-[#2563EB] hover:bg-blue-600 text-white"
              >
                List Your Space
              </Button>
              <Button
                variant="dark"
                size="md"
                to="/pricing"
              >
                Calculate Potential Yield
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* ── 5. FINAL ACTION BANNER ─────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 w-full text-center">
        <div className="border border-[#DDE3EA] rounded-xl bg-white p-8 sm:p-12 shadow-2xs">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight mb-3">
            Find guaranteed parking near your destination
          </h2>
          <p className="text-sm sm:text-base text-[#334155] max-w-lg mx-auto mb-6 font-normal">
            Search hundreds of verified parking bays across active metro hubs with transparent hourly pricing.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              to="/find"
            >
              <Search size={16} />
              <span>Explore Interactive Map</span>
            </Button>
            {userInfo ? (
              <Button
                variant="secondary"
                size="lg"
                to={userInfo.role === "host" ? "/host/dashboard" : "/dashboard"}
              >
                Go to My Dashboard
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="lg"
                to="/register"
              >
                Create Account
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ── BECOME HOST UPGRADE MODAL ──────────────────────────── */}
      {showHostUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#DDE3EA] space-y-5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <button
                type="button"
                onClick={() => setShowHostUpgradeModal(false)}
                className="p-1 rounded-lg text-[#475569] hover:text-[#0F172A] hover:bg-[#F4F6F8] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">
                Activate Space Host Mode
              </h3>
              <p className="text-xs text-[#334155] mt-1">
                You are currently signed in as a Driver (<strong className="text-[#0F172A]">{userInfo?.username}</strong>).
              </p>
              <p className="text-xs text-[#334155] mt-3 leading-relaxed">
                To list a parking space, garage, or driveway, activate Host mode on your account. It takes one click, and gives you instant access to listing tools and rental payouts.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 text-xs text-[#1E293B]">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-[#16845B] shrink-0" />
                <span>Monetize unused residential driveways or garages</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-[#16845B] shrink-0" />
                <span>Set custom hourly rates & availability schedules</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-[#16845B] shrink-0" />
                <span>Live driver tracking and verified post-stay payouts</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F1F5F9]">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setShowHostUpgradeModal(false)}
                disabled={isUpgrading}
              >
                Maybe Later
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleUpgradeToHost}
                isLoading={isUpgrading}
              >
                Activate Host & List Space
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
