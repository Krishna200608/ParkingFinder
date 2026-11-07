import React from "react";
import { Link } from "react-router-dom";
import {
  Car,
  MapPin,
  Lock,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Search,
} from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import PageHeader from "../components/ui/PageHeader";

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-20 space-y-12">
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <PageHeader
        title="About ParkingFinder"
        description="A peer-to-peer and commercial urban parking marketplace engineered with concurrency write-locks and algorithmic yield simulation."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "About" },
        ]}
      />

      {/* ── CORE PRODUCT STORY ─────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">
          Solving urban parking friction through transparent marketplace mechanics
        </h2>
        <div className="grid md:grid-cols-2 gap-6 text-xs text-[#334155] leading-relaxed">
          <p>
            Finding parking in high-density urban corridors costs drivers time, generates unnecessary fuel burn, and creates road congestion. Meanwhile, thousands of private residential driveways, parking garages, and commercial bays sit unoccupied throughout the workday.
          </p>
          <p>
            ParkingFinder bridges this gap by providing an open discovery map and a two-sided marketplace. Drivers reserve exact arrival and departure windows with strict concurrency protection, while hosts monetize idle spaces with automated availability controls.
          </p>
        </div>
      </section>

      {/* ── TWO-SIDED VALUE PROPOSITIONS ───────────────────────── */}
      <section className="grid sm:grid-cols-2 gap-5">
        <Card padding="lg">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center mb-4">
            <Car size={18} />
          </div>
          <h3 className="text-base font-bold text-[#0F172A] mb-2">
            For Urban Drivers
          </h3>
          <ul className="space-y-2 text-xs text-[#334155] mb-5">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-[#16845B] shrink-0 mt-0.5" />
              <span>Real-time geospatial search via OpenStreetMap & GPS.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-[#16845B] shrink-0 mt-0.5" />
              <span>Concurrency write locks guarantee zero overlapping double-bookings.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-[#16845B] shrink-0 mt-0.5" />
              <span>Instant zero-cost demo reservations or Stripe test-mode checkout.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-[#16845B] shrink-0 mt-0.5" />
              <span>Filter by EV charging, CCTV, and vehicle compatibility.</span>
            </li>
          </ul>
          <Button variant="outline" size="sm" href="/find">
            Explore Map Spaces
          </Button>
        </Card>

        <Card padding="lg">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 text-[#16845B] flex items-center justify-center mb-4">
            <TrendingUp size={18} />
          </div>
          <h3 className="text-base font-bold text-[#0F172A] mb-2">
            For Space Hosts
          </h3>
          <ul className="space-y-2 text-xs text-[#334155] mb-5">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-[#16845B] shrink-0 mt-0.5" />
              <span>Monetize driveways, commercial garages, or assigned tenant spaces.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-[#16845B] shrink-0 mt-0.5" />
              <span>Real-time availability toggle to pause or activate listings on demand.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-[#16845B] shrink-0 mt-0.5" />
              <span>Dynamic pricing simulator with 3-factor yield calculations.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-[#16845B] shrink-0 mt-0.5" />
              <span>Live incoming reservations table with driver identity details.</span>
            </li>
          </ul>
          <Button variant="outline" size="sm" href="/host/add-spot">
            List Your Space
          </Button>
        </Card>
      </section>

      {/* ── ARCHITECTURAL INTEGRITY ────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-[#0F172A]">
          Technical Foundations
        </h2>
        <div className="grid sm:grid-cols-3 gap-4 text-xs">
          <Card padding="default">
            <h4 className="font-semibold text-[#0F172A] mb-1">
              Geospatial Indexing
            </h4>
            <p className="text-[#334155] leading-relaxed">
              MongoDB 2dsphere spherical indexes calculate distances in real-time, querying radial bounds up to 50 km.
            </p>
          </Card>

          <Card padding="default">
            <h4 className="font-semibold text-[#0F172A] mb-1">
              Temporal Write Locks
            </h4>
            <p className="text-[#334155] leading-relaxed">
              Half-open interval overlap detection [start, end) prevents race conditions when multiple drivers reserve simultaneously.
            </p>
          </Card>

          <Card padding="default">
            <h4 className="font-semibold text-[#0F172A] mb-1">
              Free-Tier Sustainable
            </h4>
            <p className="text-[#334155] leading-relaxed">
              Engineered cleanly to run within zero-cost development tiers (Vercel, Render, and MongoDB Atlas).
            </p>
          </Card>
        </div>
      </section>

      {/* ── CALL TO ACTION ─────────────────────────────────────── */}
      <Card padding="lg" className="text-center bg-[#F8FAFC]">
        <h3 className="text-lg font-bold text-[#0F172A] mb-2">
          Experience ParkingFinder Today
        </h3>
        <p className="text-xs sm:text-sm text-[#334155] max-w-md mx-auto mb-5 font-normal">
          Find an active parking space near your destination or list your driveway to earn passive revenue.
        </p>
        <div className="flex flex-wrap justify-center items-center gap-2.5">
          <Button variant="primary" size="md" href="/find">
            <Search size={14} /> Open Discovery Map
          </Button>
          <Button variant="secondary" size="md" href="/register">
            Create Free Account
          </Button>
        </div>
      </Card>
    </div>
  );
}
