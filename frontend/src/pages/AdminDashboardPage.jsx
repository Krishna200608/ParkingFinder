import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Car,
  Users,
  Calendar,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  Briefcase,
} from "lucide-react";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { Badge, StatusBadge } from "../components/ui/Badge";
import PageHeader from "../components/ui/PageHeader";
import Tabs from "../components/ui/Tabs";
import EmptyState from "../components/ui/EmptyState";
import { CardSkeleton } from "../components/ui/Skeleton";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "spots" | "users" | "bookings"
  const [metrics, setMetrics] = useState(null);
  const [recentActivity, setRecentActivity] = useState({ payments: [], bookings: [] });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Spot Moderation State
  const [spots, setSpots] = useState([]);
  const [spotPagination, setSpotPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [spotSearch, setSpotSearch] = useState("");
  const [spotStatusFilter, setSpotStatusFilter] = useState("all");
  const [loadingSpots, setLoadingSpots] = useState(false);
  const [togglingSpotId, setTogglingSpotId] = useState(null);

  // User RBAC State
  const [users, setUsers] = useState([]);
  const [userPagination, setUserPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  // Bookings Audit State
  const [bookings, setBookings] = useState([]);
  const [bookingPagination, setBookingPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Fetch Platform Overview Metrics
  const fetchMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const { data } = await axios.get("/api/admin/metrics", { withCredentials: true });
      setMetrics(data.metrics);
      setRecentActivity(data.recentActivity || { payments: [], bookings: [] });
    } catch (error) {
      console.error("Failed to load platform metrics:", error);
      toast.error(error.response?.data?.message || "Failed to load platform analytics");
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  // Fetch Spot Directory for Moderation
  const fetchSpots = useCallback(async (page = 1) => {
    setLoadingSpots(true);
    try {
      const params = { page, limit: 10 };
      if (spotSearch.trim()) params.search = spotSearch.trim();
      if (spotStatusFilter !== "all") params.status = spotStatusFilter;

      const { data } = await axios.get("/api/admin/spots", {
        params,
        withCredentials: true,
      });

      setSpots(data.spots || []);
      setSpotPagination(data.pagination || { page: 1, limit: 10, totalPages: 1, total: 0 });
    } catch (error) {
      console.error("Failed to load spots for moderation:", error);
      toast.error(error.response?.data?.message || "Failed to load spot directory");
    } finally {
      setLoadingSpots(false);
    }
  }, [spotSearch, spotStatusFilter]);

  // Fetch User Directory
  const fetchUsers = useCallback(async (page = 1) => {
    setLoadingUsers(true);
    try {
      const params = { page, limit: 10 };
      if (userSearch.trim()) params.search = userSearch.trim();
      if (userRoleFilter !== "all") params.role = userRoleFilter;

      const { data } = await axios.get("/api/admin/users", {
        params,
        withCredentials: true,
      });

      setUsers(data.users || []);
      setUserPagination(data.pagination || { page: 1, limit: 10, totalPages: 1, total: 0 });
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error(error.response?.data?.message || "Failed to load user directory");
    } finally {
      setLoadingUsers(false);
    }
  }, [userSearch, userRoleFilter]);

  // Fetch Global Booking Audit Trail
  const fetchBookings = useCallback(async (page = 1) => {
    setLoadingBookings(true);
    try {
      const params = { page, limit: 10 };
      if (bookingStatusFilter !== "all") params.status = bookingStatusFilter;

      const { data } = await axios.get("/api/admin/bookings", {
        params,
        withCredentials: true,
      });

      setBookings(data.bookings || []);
      setBookingPagination(data.pagination || { page: 1, limit: 10, totalPages: 1, total: 0 });
    } catch (error) {
      console.error("Failed to load bookings:", error);
      toast.error(error.response?.data?.message || "Failed to load booking audit records");
    } finally {
      setLoadingBookings(false);
    }
  }, [bookingStatusFilter]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (activeTab === "spots") fetchSpots(1);
    if (activeTab === "users") fetchUsers(1);
    if (activeTab === "bookings") fetchBookings(1);
  }, [activeTab, fetchSpots, fetchUsers, fetchBookings]);

  // Handle Spot Availability Toggle (Suspend/Activate)
  const handleToggleSpot = async (spotId, currentStatus) => {
    setTogglingSpotId(spotId);
    try {
      const newStatus = !currentStatus;
      await axios.put(
        `/api/admin/spots/${spotId}/status`,
        { isAvailable: newStatus },
        { withCredentials: true }
      );
      toast.success(`Spot has been ${newStatus ? "activated" : "suspended"}`);
      setSpots((prev) =>
        prev.map((s) => (s._id === spotId ? { ...s, isAvailable: newStatus } : s))
      );
      // Refresh overview metrics in background
      fetchMetrics();
    } catch (error) {
      console.error("Failed to update spot status:", error);
      toast.error(error.response?.data?.message || "Failed to update spot status");
    } finally {
      setTogglingSpotId(null);
    }
  };

  // Handle User Role Modification (RBAC)
  const handleRoleChange = async (userId, newRole) => {
    setUpdatingUserId(userId);
    try {
      await axios.put(
        `/api/admin/users/${userId}/role`,
        { role: newRole },
        { withCredentials: true }
      );
      toast.success(`User role successfully changed to ${newRole}`);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      // Refresh overview metrics
      fetchMetrics();
    } catch (error) {
      console.error("Failed to update user role:", error);
      toast.error(error.response?.data?.message || "Failed to update role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const tabsConfig = [
    { id: "overview", label: "Executive Analytics", icon: TrendingUp },
    { id: "spots", label: "Spot Moderation", icon: Car, count: metrics?.inventory?.totalSpots },
    { id: "users", label: "User Directory & RBAC", icon: Users, count: metrics?.users?.total },
    { id: "bookings", label: "Booking Audit Trail", icon: Calendar, count: metrics?.bookings?.total },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <PageHeader
        title="Platform Governance & Control Center"
        description="Real-time marketplace observability, revenue reconciliation, spot moderation, and role-based access control."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Admin Console" },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchMetrics();
              if (activeTab === "spots") fetchSpots(spotPagination.page);
              if (activeTab === "users") fetchUsers(userPagination.page);
              if (activeTab === "bookings") fetchBookings(bookingPagination.page);
              toast.success("Platform state synchronized");
            }}
            className="flex items-center gap-1.5"
          >
            <RefreshCw size={14} />
            <span>Sync State</span>
          </Button>
        }
      />

      {/* Top Level KPI Stat Cards */}
      {loadingMetrics ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Gross Merchandise Value */}
          <Card className="p-4 border-l-4 border-l-blue-600">
            <div className="flex items-center justify-between text-xs text-[#475569] font-medium">
              <span>Gross Merchandise Value</span>
              <DollarSign size={16} className="text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0F172A]">
                ${metrics.financials?.grossMerchandiseValue?.toFixed(2) || "0.00"}
              </span>
              <span className="text-[11px] text-[#475569]">volume</span>
            </div>
            <div className="mt-2 pt-2 border-t border-[#DDE3EA] flex items-center justify-between text-[11px] text-[#475569]">
              <span>Platform Take (5%):</span>
              <span className="font-semibold text-emerald-700">
                ${metrics.financials?.platformRevenue?.toFixed(2) || "0.00"}
              </span>
            </div>
          </Card>

          {/* Card 2: Parking Inventory */}
          <Card className="p-4 border-l-4 border-l-emerald-600">
            <div className="flex items-center justify-between text-xs text-[#475569] font-medium">
              <span>Active Bays / Total</span>
              <Car size={16} className="text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0F172A]">
                {metrics.inventory?.activeSpots || 0}
              </span>
              <span className="text-sm font-medium text-[#475569]">
                / {metrics.inventory?.totalSpots || 0} spots
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-[#DDE3EA] flex items-center justify-between text-[11px] text-[#475569]">
              <span>Avg Hourly Rate:</span>
              <span className="font-semibold text-[#0F172A]">
                ${metrics.inventory?.avgPricePerHour?.toFixed(2) || "0.00"}/hr
              </span>
            </div>
          </Card>

          {/* Card 3: Registered Users & RBAC */}
          <Card className="p-4 border-l-4 border-l-indigo-600">
            <div className="flex items-center justify-between text-xs text-[#475569] font-medium">
              <span>Platform Accounts</span>
              <Users size={16} className="text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0F172A]">
                {metrics.users?.total || 0}
              </span>
              <span className="text-[11px] text-[#475569]">registered</span>
            </div>
            <div className="mt-2 pt-2 border-t border-[#DDE3EA] flex items-center justify-between text-[11px] text-[#475569]">
              <span>Drivers: {metrics.users?.drivers || 0}</span>
              <span>Hosts: {metrics.users?.hosts || 0}</span>
              <span className="font-medium text-purple-700">Admins: {metrics.users?.admins || 0}</span>
            </div>
          </Card>

          {/* Card 4: Bookings & Utilization */}
          <Card className="p-4 border-l-4 border-l-amber-600">
            <div className="flex items-center justify-between text-xs text-[#475569] font-medium">
              <span>Reservation Volume</span>
              <Calendar size={16} className="text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0F172A]">
                {metrics.bookings?.total || 0}
              </span>
              <span className="text-[11px] text-[#475569]">bookings</span>
            </div>
            <div className="mt-2 pt-2 border-t border-[#DDE3EA] flex items-center justify-between text-[11px] text-[#475569]">
              <span>Hours Booked:</span>
              <span className="font-semibold text-[#0F172A]">
                {metrics.bookings?.hoursBooked || 0} hrs
              </span>
            </div>
          </Card>
        </div>
      ) : null}

      {/* Navigation Tabs */}
      <Tabs tabs={tabsConfig} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Executive Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Marketplace Economics Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 bg-white border border-[#DDE3EA]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#475569]">
                <TrendingUp size={15} className="text-blue-600" />
                <span>Marketplace Economics</span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#475569]">Gross Volume (GMV):</span>
                  <span className="font-bold text-[#0F172A]">
                    ${metrics?.financials?.grossMerchandiseValue?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#475569]">Platform Fee Take Rate (5%):</span>
                  <span className="font-bold text-emerald-700">
                    ${metrics?.financials?.platformRevenue?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#475569]">Host Payout Liabilities (95%):</span>
                  <span className="font-bold text-slate-700">
                    ${metrics?.financials?.hostLiabilities?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-[#DDE3EA]">
                  <span className="text-[#475569]">Processed Transactions:</span>
                  <span className="font-bold text-blue-700">
                    {metrics?.financials?.successfulTransactions || 0} successful
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-white border border-[#DDE3EA]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#475569]">
                <Calendar size={15} className="text-amber-600" />
                <span>Booking Status Distribution</span>
              </div>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#475569]">Confirmed & Paid:</span>
                  <span className="font-semibold text-emerald-700">{metrics?.bookings?.status?.confirmed || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#475569]">Currently Active:</span>
                  <span className="font-semibold text-blue-700">{metrics?.bookings?.status?.active || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#475569]">Completed:</span>
                  <span className="font-semibold text-slate-700">{metrics?.bookings?.status?.completed || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#475569]">Cancelled:</span>
                  <span className="font-semibold text-rose-700">{metrics?.bookings?.status?.cancelled || 0}</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-white border border-[#DDE3EA]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#475569]">
                <ShieldCheck size={15} className="text-emerald-600" />
                <span>System Architecture Health</span>
              </div>
              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#475569]">Database Engine:</span>
                  <span className="font-medium text-[#0F172A]">MongoDB Atlas (Replica Set)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#475569]">Concurrency Control:</span>
                  <span className="font-medium text-emerald-700">Atomic Locks + Retries</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#475569]">Payment Gateway:</span>
                  <span className="font-medium text-[#0F172A]">Stripe Test Mode + Sandbox</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#475569]">API Documentation:</span>
                  <a
                    href="/api-docs"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    <span>OpenAPI 3.0</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Financial Transactions Table */}
          <Card className="overflow-hidden bg-white border border-[#DDE3EA]">
            <div className="p-4 border-b border-[#DDE3EA] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Recent Payment Ledger Transactions</h3>
                <p className="text-xs text-[#475569]">Latest 10 payment intents and checkout sessions across all drivers.</p>
              </div>
            </div>

            {recentActivity.payments?.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#475569]">
                No payment transactions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[#475569] font-medium border-b border-[#DDE3EA]">
                    <tr>
                      <th className="px-4 py-2.5">Payment ID</th>
                      <th className="px-4 py-2.5">Payer Account</th>
                      <th className="px-4 py-2.5">Parking Bay</th>
                      <th className="px-4 py-2.5">Amount</th>
                      <th className="px-4 py-2.5">Method</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {recentActivity.payments.map((p) => (
                      <tr key={p._id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-slate-800 font-medium">
                          {p.paymentId || p._id.substring(0, 8)}
                        </td>
                        <td className="px-4 py-2.5 text-slate-900">
                          {p.user?.username || "Driver"}
                          <div className="text-[10px] text-slate-400">{p.user?.email}</div>
                        </td>
                        <td className="px-4 py-2.5 text-slate-700 max-w-[200px] truncate">
                          {p.booking?.spot?.title || "Reserved Space"}
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-slate-900">
                          ${p.amount?.toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 uppercase text-[10px]">
                          {p.paymentMethod || "stripe"}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                          {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 2: Parking Spot Moderation */}
      {activeTab === "spots" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <Card className="p-4 bg-white border border-[#DDE3EA]">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Search */}
              <div className="relative w-full sm:w-80">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search listings by title or address..."
                  value={spotSearch}
                  onChange={(e) => setSpotSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchSpots(1)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter size={14} className="text-slate-400 shrink-0" />
                <select
                  value={spotStatusFilter}
                  onChange={(e) => {
                    setSpotStatusFilter(e.target.value);
                  }}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-[#CBD5E1] bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="all">All Moderation States</option>
                  <option value="active">Active Only</option>
                  <option value="suspended">Suspended Only</option>
                </select>

                <Button size="sm" variant="secondary" onClick={() => fetchSpots(1)}>
                  Apply Filter
                </Button>
              </div>
            </div>
          </Card>

          {/* Spots Table */}
          <Card className="overflow-hidden bg-white border border-[#DDE3EA]">
            {loadingSpots ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading spot directory...</div>
            ) : spots.length === 0 ? (
              <EmptyState
                title="No parking spots matched"
                description="Try clearing your search term or changing the status filter."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[#475569] font-medium border-b border-[#DDE3EA]">
                    <tr>
                      <th className="px-4 py-3">Listing</th>
                      <th className="px-4 py-3">Host Owner</th>
                      <th className="px-4 py-3">Rate</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Rating</th>
                      <th className="px-4 py-3">Availability</th>
                      <th className="px-4 py-3 text-right">Moderation Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {spots.map((spot) => (
                      <tr key={spot._id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                        <td className="px-4 py-3">
                          <Link
                            to={`/spots/${spot._id}`}
                            className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <span>{spot.title || "Parking Space"}</span>
                            <ExternalLink size={11} />
                          </Link>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{spot.address}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-800">
                          <div>{spot.owner?.username || "Unknown Host"}</div>
                          <div className="text-[10px] text-slate-400">{spot.owner?.email}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          ${spot.pricePerHour}/hr
                        </td>
                        <td className="px-4 py-3">
                          <span className="capitalize px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {spot.spotType || "p2p"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {spot.rating ? `${spot.rating.toFixed(1)} / 5` : "No reviews"}
                        </td>
                        <td className="px-4 py-3">
                          {spot.isAvailable ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle size={11} />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <XCircle size={11} />
                              Suspended
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant={spot.isAvailable ? "danger" : "primary"}
                            loading={togglingSpotId === spot._id}
                            onClick={() => handleToggleSpot(spot._id, spot.isAvailable)}
                            className="text-[11px] py-1 px-2.5"
                          >
                            {spot.isAvailable ? "Suspend Listing" : "Activate Listing"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {spotPagination.totalPages > 1 && (
              <div className="p-3 border-t border-[#DDE3EA] flex items-center justify-between text-xs text-slate-600 bg-[#F8FAFC]">
                <span>
                  Showing {spots.length} of {spotPagination.total} listings
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={spotPagination.page <= 1}
                    onClick={() => fetchSpots(spotPagination.page - 1)}
                    className="p-1.5"
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <span>
                    Page {spotPagination.page} of {spotPagination.totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={spotPagination.page >= spotPagination.totalPages}
                    onClick={() => fetchSpots(spotPagination.page + 1)}
                    className="p-1.5"
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 3: User Directory & RBAC Governance */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <Card className="p-4 bg-white border border-[#DDE3EA]">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Search */}
              <div className="relative w-full sm:w-80">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchUsers(1)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Role Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter size={14} className="text-slate-400 shrink-0" />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-[#CBD5E1] bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="all">All Platform Roles</option>
                  <option value="driver">Drivers Only</option>
                  <option value="host">Hosts Only</option>
                  <option value="admin">Administrators Only</option>
                </select>

                <Button size="sm" variant="secondary" onClick={() => fetchUsers(1)}>
                  Apply Filter
                </Button>
              </div>
            </div>
          </Card>

          {/* Users Table */}
          <Card className="overflow-hidden bg-white border border-[#DDE3EA]">
            {loadingUsers ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading user directory...</div>
            ) : users.length === 0 ? (
              <EmptyState
                title="No users matched"
                description="Try searching with a different keyword or removing role filters."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[#475569] font-medium border-b border-[#DDE3EA]">
                    <tr>
                      <th className="px-4 py-3">Account</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Vehicle Info</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3 text-right">RBAC Role Reassignment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{u.username}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {u.phone || "No phone listed"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {u.vehicleInfo?.make || u.vehicleInfo?.licensePlate ? (
                            <span>
                              {u.vehicleInfo.make} {u.vehicleInfo.model}
                              {u.vehicleInfo.licensePlate ? ` (${u.vehicleInfo.licensePlate})` : ""}
                            </span>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              u.role === "admin"
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : u.role === "host"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            <Shield size={10} />
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <select
                            value={u.role}
                            disabled={updatingUserId === u._id}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            className="px-2 py-1 text-xs rounded border border-[#CBD5E1] bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                          >
                            <option value="driver">Driver</option>
                            <option value="host">Host</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {userPagination.totalPages > 1 && (
              <div className="p-3 border-t border-[#DDE3EA] flex items-center justify-between text-xs text-slate-600 bg-[#F8FAFC]">
                <span>
                  Showing {users.length} of {userPagination.total} accounts
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={userPagination.page <= 1}
                    onClick={() => fetchUsers(userPagination.page - 1)}
                    className="p-1.5"
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <span>
                    Page {userPagination.page} of {userPagination.totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={userPagination.page >= userPagination.totalPages}
                    onClick={() => fetchUsers(userPagination.page + 1)}
                    className="p-1.5"
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 4: Global Bookings Audit Trail */}
      {activeTab === "bookings" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <Card className="p-4 bg-white border border-[#DDE3EA]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400 shrink-0" />
                <span className="text-xs font-medium text-slate-600">Filter Lifecycle:</span>
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-[#CBD5E1] bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="all">All Reservation States</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="pending">Pending</option>
                </select>
                <Button size="sm" variant="secondary" onClick={() => fetchBookings(1)}>
                  Apply
                </Button>
              </div>
            </div>
          </Card>

          {/* Bookings Table */}
          <Card className="overflow-hidden bg-white border border-[#DDE3EA]">
            {loadingBookings ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading booking records...</div>
            ) : bookings.length === 0 ? (
              <EmptyState
                title="No reservations found"
                description="No booking records match the selected status filter."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[#475569] font-medium border-b border-[#DDE3EA]">
                    <tr>
                      <th className="px-4 py-3">Booking ID</th>
                      <th className="px-4 py-3">Reserved Bay</th>
                      <th className="px-4 py-3">Driver Account</th>
                      <th className="px-4 py-3">Host Account</th>
                      <th className="px-4 py-3">Interval</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {bookings.map((b) => (
                      <tr key={b._id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-800">
                          {b._id.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{b.spot?.title || "Parking Spot"}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{b.spot?.address}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-800">
                          <div>{b.user?.username || "Driver"}</div>
                          <div className="text-[10px] text-slate-400">{b.user?.email}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-800">
                          <div>{b.host?.username || "Host"}</div>
                          <div className="text-[10px] text-slate-400">{b.host?.email}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-[11px]">
                          <div>{new Date(b.startTime).toLocaleDateString()}</div>
                          <div className="text-slate-400">
                            {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          ${b.totalCost?.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {bookingPagination.totalPages > 1 && (
              <div className="p-3 border-t border-[#DDE3EA] flex items-center justify-between text-xs text-slate-600 bg-[#F8FAFC]">
                <span>
                  Showing {bookings.length} of {bookingPagination.total} bookings
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bookingPagination.page <= 1}
                    onClick={() => fetchBookings(bookingPagination.page - 1)}
                    className="p-1.5"
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <span>
                    Page {bookingPagination.page} of {bookingPagination.totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bookingPagination.page >= bookingPagination.totalPages}
                    onClick={() => fetchBookings(bookingPagination.page + 1)}
                    className="p-1.5"
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
