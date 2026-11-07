import React, { useState, useMemo } from "react";
import {
  Check,
  Sliders,
  TrendingUp,
  Zap,
  ShieldCheck,
  Clock,
  DollarSign,
  BarChart3,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import PageHeader from "../components/ui/PageHeader";
import { useAuth } from "../context/AuthContext";

const TIME_WINDOWS = [
  { key: "night", label: "Late Night (00:00 - 06:00)", surgeFactor: -0.25 },
  { key: "morning_rush", label: "Morning Peak (08:00 - 10:00)", surgeFactor: 0.35 },
  { key: "midday", label: "Midday Business (11:00 - 16:00)", surgeFactor: 0.05 },
  { key: "evening_rush", label: "Evening Rush (17:00 - 20:00)", surgeFactor: 0.40 },
  { key: "late_evening", label: "Late Evening (21:00 - 23:00)", surgeFactor: -0.10 },
];

export default function PricingPage() {
  const { userInfo } = useAuth();

  const plans = [
    {
      name: "Basic Driver",
      price: "Free",
      desc: "Transparent zero-fee discovery for everyday urban commuters.",
      features: [
        "Interactive real-time map discovery",
        "Instant demo reservations (no credit card)",
        "Self-service cancellation before arrival",
        "Distance, vehicle size, and amenity filters",
      ],
      cta: "Explore Map",
      href: "/find",
      highlight: false,
    },
    {
      name: "Pro Commuter",
      price: "$9.99/mo",
      desc: "Automated tools and priority locks for frequent daily drivers.",
      features: [
        "Everything in Basic Driver",
        "Recurring automated schedule reserving",
        "Peak-hour hold guarantees",
        "Saved favorite spaces & one-tap routing",
        "Digital transaction receipts & exports",
      ],
      cta: userInfo ? "Access Features in App" : "Start Free Trial",
      href: userInfo ? "/find" : "/register",
      highlight: true,
    },
    {
      name: "Partner Host",
      price: "5% per booking",
      desc: "Monetize residential driveways, parking garages, or commercial bays.",
      features: [
        "Unlimited parking space listings",
        "Real-time instant active/pause availability toggle",
        "Live driver reservations tracking portal",
        "Dynamic pricing algorithmic rate simulator",
        "Verified post-stay driver ratings & reviews",
      ],
      cta: userInfo ? (userInfo.role === "host" ? "Go to Host Dashboard" : "List Your Space") : "Become a Host",
      href: userInfo ? (userInfo.role === "host" ? "/host/dashboard" : "/host/add-spot") : "/register",
      highlight: false,
    },
  ];

  // Simulator State
  const [basePrice, setBasePrice] = useState(15);
  const [occupancyRate, setOccupancyRate] = useState(75);
  const [elasticity, setElasticity] = useState(0.5);
  const [timeWindowKey, setTimeWindowKey] = useState("evening_rush");
  const [hasEV, setHasEV] = useState(true);
  const [isCovered, setIsCovered] = useState(true);

  const currentSurge = useMemo(() => {
    const found = TIME_WINDOWS.find((w) => w.key === timeWindowKey);
    return found ? found.surgeFactor : 0;
  }, [timeWindowKey]);

  const calculatedPrice = useMemo(() => {
    const demandComponent = elasticity * (occupancyRate / 100);
    const amenityPremium = (hasEV ? 0.15 : 0) + (isCovered ? 0.10 : 0);
    const multiplier = 1 + demandComponent + currentSurge + amenityPremium;
    const raw = basePrice * multiplier;
    return Math.max(1, Math.round(raw * 100) / 100);
  }, [basePrice, occupancyRate, elasticity, currentSurge, hasEV, isCovered]);

  const priceDeltaPct = useMemo(() => {
    return Math.round(((calculatedPrice - basePrice) / basePrice) * 100);
  }, [calculatedPrice, basePrice]);

  const estimatedDailyRevenue = useMemo(() => {
    return Math.round(calculatedPrice * 14 * (occupancyRate / 100) * 10) / 10;
  }, [calculatedPrice, occupancyRate]);

  const hourlyProfile = useMemo(() => {
    return Array.from({ length: 24 }).map((_, hour) => {
      let hourSurge = 0;
      if (hour >= 0 && hour < 6) hourSurge = -0.25;
      else if (hour >= 8 && hour <= 10) hourSurge = 0.35;
      else if (hour >= 11 && hour <= 16) hourSurge = 0.05;
      else if (hour >= 17 && hour <= 20) hourSurge = 0.40;
      else if (hour >= 21) hourSurge = -0.10;

      const demandComp = elasticity * (occupancyRate / 100);
      const amenityPremium = (hasEV ? 0.15 : 0) + (isCovered ? 0.10 : 0);
      const price = Math.max(
        1,
        Math.round(basePrice * (1 + demandComp + hourSurge + amenityPremium) * 10) / 10
      );
      return { hour, price };
    });
  }, [basePrice, occupancyRate, elasticity, hasEV, isCovered]);

  const applyPreset = (preset) => {
    if (preset === "downtown_peak") {
      setBasePrice(25);
      setOccupancyRate(95);
      setElasticity(0.8);
      setTimeWindowKey("evening_rush");
      setHasEV(true);
      setIsCovered(true);
    } else if (preset === "airport_transit") {
      setBasePrice(18);
      setOccupancyRate(85);
      setElasticity(0.5);
      setTimeWindowKey("morning_rush");
      setHasEV(true);
      setIsCovered(true);
    } else if (preset === "residential_night") {
      setBasePrice(10);
      setOccupancyRate(30);
      setElasticity(0.2);
      setTimeWindowKey("night");
      setHasEV(false);
      setIsCovered(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20 space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <Badge variant="brand" size="sm" className="mb-2">
          Transparent Marketplace Pricing
        </Badge>
        <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">
          Simple plans and intelligent dynamic pricing
        </h1>
        <p className="text-sm text-[#334155] mt-2 font-normal">
          Discover guaranteed spaces without hidden valet fees, or monetize unused parking with automated demand-based yield modeling.
        </p>
      </div>

      {/* ── 3 TIERS GRID ───────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((plan, i) => (
          <Card
            key={i}
            padding="lg"
            className={`flex flex-col justify-between ${
              plan.highlight
                ? "border-[#2563EB] ring-2 ring-blue-100 shadow-sm"
                : ""
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-base font-bold text-[#0F172A]">
                  {plan.name}
                </h2>
                {plan.highlight && (
                  <Badge variant="brand" size="sm">
                    Recommended
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#334155] mb-4 min-h-[32px] leading-relaxed">
                {plan.desc}
              </p>
              <div className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-5">
                {plan.price}
              </div>

              <ul className="text-xs text-[#1E293B] space-y-2.5 mb-6">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <Check className="text-[#16845B] shrink-0 mt-0.5" size={14} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              variant={plan.highlight ? "primary" : "outline"}
              size="md"
              href={plan.href}
              className="w-full justify-center"
            >
              {plan.cta}
            </Button>
          </Card>
        ))}
      </div>

      {/* ── DYNAMIC PRICING SIMULATOR ──────────────────────────── */}
      <Card padding="none" className="overflow-hidden">
        {/* Simulator Header */}
        <div className="bg-[#0F172A] text-white p-6 sm:p-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Badge variant="neutral" size="sm" className="bg-slate-800 text-slate-200 border-slate-700 mb-2">
                Algorithmic Engine
              </Badge>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Dynamic Pricing & Revenue Simulator
              </h2>
              <p className="text-slate-200 text-xs sm:text-sm mt-1 max-w-xl">
                Simulates real-time rate adjustments based on occupancy density (D), time-of-day surge (T), and demand sensitivity (α).
              </p>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <span className="text-xs text-slate-300 mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset("downtown_peak")}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition cursor-pointer"
              >
                Downtown Peak
              </button>
              <button
                type="button"
                onClick={() => applyPreset("airport_transit")}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition cursor-pointer"
              >
                Airport Hub
              </button>
              <button
                type="button"
                onClick={() => applyPreset("residential_night")}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition cursor-pointer"
              >
                Night Off-Peak
              </button>
            </div>
          </div>
        </div>

        {/* Simulator Grid */}
        <div className="p-6 sm:p-7 grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-5 text-xs">
            {/* Control 1: Base Rate */}
            <div>
              <div className="flex justify-between items-center font-semibold text-[#0F172A] mb-1.5">
                <span className="flex items-center gap-1.5">
                  <DollarSign size={14} className="text-[#2563EB]" /> Base Hourly Rate (P_base)
                </span>
                <span className="text-sm font-bold text-[#2563EB]">
                  ${basePrice} / hr
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full accent-[#2563EB] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#475569] mt-1 font-medium">
                <span>$5/hr (Residential)</span>
                <span>$25/hr (Urban Center)</span>
                <span>$50/hr (Prime Commercial)</span>
              </div>
            </div>

            {/* Control 2: Occupancy Rate */}
            <div>
              <div className="flex justify-between items-center font-semibold text-[#0F172A] mb-1.5">
                <span className="flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-[#2563EB]" /> Zone Occupancy Density (D)
                </span>
                <span
                  className={`text-sm font-bold ${
                    occupancyRate >= 80
                      ? "text-[#DC4545]"
                      : occupancyRate >= 50
                      ? "text-[#D97706]"
                      : "text-[#16845B]"
                  }`}
                >
                  {occupancyRate}% Occupied
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={occupancyRate}
                onChange={(e) => setOccupancyRate(Number(e.target.value))}
                className="w-full accent-[#2563EB] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#475569] mt-1 font-medium">
                <span>0% (Empty)</span>
                <span>50% (Normal Demand)</span>
                <span>100% (High Congestion)</span>
              </div>
            </div>

            {/* Control 3: Time Window */}
            <div>
              <label
                htmlFor="timeWindow"
                className="block font-semibold text-[#0F172A] mb-1.5 flex items-center gap-1.5"
              >
                <Clock size={14} className="text-[#2563EB]" /> Time Window (T_surge)
              </label>
              <select
                id="timeWindow"
                value={timeWindowKey}
                onChange={(e) => setTimeWindowKey(e.target.value)}
                className="w-full border border-[#DDE3EA] rounded-lg p-2 text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#2563EB]"
              >
                {TIME_WINDOWS.map((w) => (
                  <option key={w.key} value={w.key}>
                    {w.label} — (
                    {w.surgeFactor >= 0
                      ? `+${Math.round(w.surgeFactor * 100)}%`
                      : `${Math.round(w.surgeFactor * 100)}%`}
                    )
                  </option>
                ))}
              </select>
            </div>

            {/* Control 4: Elasticity & Amenities */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="elasticitySelect"
                  className="block font-semibold text-[#0F172A] mb-1.5"
                >
                  Demand Elasticity (α)
                </label>
                <select
                  id="elasticitySelect"
                  value={elasticity}
                  onChange={(e) => setElasticity(Number(e.target.value))}
                  className="w-full border border-[#DDE3EA] rounded-lg p-2 text-xs text-[#0F172A] bg-white focus:outline-none focus:border-[#2563EB]"
                >
                  <option value={0.2}>Low Elasticity (α = 0.2)</option>
                  <option value={0.5}>Balanced Standard (α = 0.5)</option>
                  <option value={0.8}>Aggressive Surge (α = 0.8)</option>
                </select>
              </div>

              <div>
                <span className="block font-semibold text-[#0F172A] mb-1.5">
                  Facility Premiums
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHasEV(!hasEV)}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                      hasEV
                        ? "bg-emerald-50 border-emerald-200 text-[#16845B]"
                        : "bg-white border-[#DDE3EA] text-[#475569] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <Zap size={12} /> EV (+15%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCovered(!isCovered)}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                      isCovered
                        ? "bg-blue-50 border-blue-200 text-[#2563EB]"
                        : "bg-white border-[#DDE3EA] text-[#475569] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <ShieldCheck size={12} /> Covered (+10%)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Output Area (5 Cols) */}
          <div className="lg:col-span-5 bg-[#F8FAFC] rounded-xl p-5 border border-[#DDE3EA] space-y-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#475569] block mb-1">
                Simulated Rate Output
              </span>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold text-[#2563EB]">
                  ${calculatedPrice}
                  <span className="text-xs text-[#475569] font-normal"> / hour</span>
                </div>
                <Badge
                  variant={priceDeltaPct >= 0 ? "success" : "neutral"}
                  size="sm"
                >
                  {priceDeltaPct >= 0 ? `+${priceDeltaPct}%` : `${priceDeltaPct}%`} vs base
                </Badge>
              </div>
            </div>

            {/* Projections */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3 rounded-lg border border-[#DDE3EA]">
              <div>
                <span className="text-[#475569] text-[11px] font-medium block">Daily Projection</span>
                <p className="font-bold text-[#0F172A] text-sm mt-0.5">
                  ${estimatedDailyRevenue}
                </p>
              </div>
              <div>
                <span className="text-[#475569] text-[11px] font-medium block">Monthly Yield</span>
                <p className="font-bold text-[#16845B] text-sm mt-0.5">
                  ${Math.round(estimatedDailyRevenue * 30)}
                </p>
              </div>
            </div>

            {/* 24-Hour Projected Price Profile Bar Chart */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#0F172A] flex items-center gap-1">
                  <BarChart3 size={13} className="text-[#2563EB]" /> 24-Hour Yield Profile
                </span>
                <span className="text-[10px] text-[#475569] font-medium">00:00 → 23:00</span>
              </div>

              <div className="h-24 bg-white rounded-lg p-2.5 border border-[#DDE3EA] flex items-end justify-between gap-1">
                {hourlyProfile.map((hp) => {
                  const maxPrice = Math.max(...hourlyProfile.map((p) => p.price));
                  const heightPct = Math.max(15, (hp.price / maxPrice) * 100);
                  const isPeak = hp.price > basePrice;

                  return (
                    <div
                      key={hp.hour}
                      className="flex-1 flex flex-col items-center group relative h-full justify-end"
                    >
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t-xs transition-all ${
                          isPeak
                            ? "bg-[#2563EB] group-hover:bg-blue-700"
                            : "bg-[#CBD5E1] group-hover:bg-slate-400"
                        }`}
                      />
                      <div className="hidden group-hover:block absolute bottom-full mb-1 z-20 bg-[#0F172A] text-white text-[9px] px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap">
                        {hp.hour}:00: ${hp.price}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-[#475569] px-1 font-medium">
                <span>12 AM</span>
                <span>8 AM (Peak)</span>
                <span>1 PM</span>
                <span>6 PM (Peak)</span>
                <span>11 PM</span>
              </div>
            </div>

            <div className="text-xs text-[#334155] bg-white p-2.5 rounded-lg border border-[#DDE3EA] space-y-0.5">
              <span className="font-semibold text-[#0F172A] flex items-center gap-1 text-[11px]">
                <RefreshCw size={11} className="text-[#2563EB]" /> Algorithm Guardrails Active
              </span>
              <p className="text-[11px] text-[#475569]">
                Calculated rates are bounded between minimum floor ($1.00/hr) and 3× base price to prevent price gouging.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
