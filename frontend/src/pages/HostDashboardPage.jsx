import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  MapPin,
  Clock,
  PlusCircle,
  Car,
  Star,
  Trash2,
  Edit3,
  ExternalLink,
  Power,
  Calendar,
  Users,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { Badge, StatusBadge } from "../components/ui/Badge";
import PageHeader from "../components/ui/PageHeader";
import Tabs from "../components/ui/Tabs";
import EmptyState from "../components/ui/EmptyState";

export default function HostDashboardPage() {
  const { userInfo } = useAuth();
  const [activeTab, setActiveTab] = useState("listings"); // "listings" | "bookings"
  const [spots, setSpots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingSpotId, setTogglingSpotId] = useState(null);
  const [deletingSpotId, setDeletingSpotId] = useState(null);

  // Fetch host's parking listings
  const fetchSpots = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/spots/my", {
        withCredentials: true,
      });
      setSpots(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching spots:", error);
      toast.error(error.response?.data?.message || "Failed to load your spots");
    }
  }, []);

  // Fetch driver reservations on host's spots
  const fetchHostBookings = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/bookings/host", {
        withCredentials: true,
      });
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching host bookings:", error);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSpots(), fetchHostBookings()]);
      setLoading(false);
    };
    loadData();
  }, [fetchSpots, fetchHostBookings]);

  // Toggle spot active availability
  const handleToggleAvailability = async (spot) => {
    try {
      setTogglingSpotId(spot._id);
      const newStatus = !spot.isAvailable;
      await axios.put(
        `/api/spots/${spot._id}`,
        { isAvailable: newStatus },
        { withCredentials: true }
      );
      toast.success(
        newStatus
          ? "Spot activated for driver reservations"
          : "Spot paused from public discovery"
      );
      setSpots((prev) =>
        prev.map((s) =>
          s._id === spot._id ? { ...s, isAvailable: newStatus } : s
        )
      );
    } catch (error) {
      console.error("Failed to toggle availability:", error);
      toast.error(
        error.response?.data?.message || "Could not update availability"
      );
    } finally {
      setTogglingSpotId(null);
    }
  };

  // Delete parking spot listing
  const handleDeleteSpot = async (spotId) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this parking space listing?"
      )
    ) {
      return;
    }

    try {
      setDeletingSpotId(spotId);
      await axios.delete(`/api/spots/${spotId}`, { withCredentials: true });
      toast.success("Parking space listing removed successfully");
      setSpots((prev) => prev.filter((s) => s._id !== spotId));
    } catch (error) {
      console.error("Failed to delete spot:", error);
      toast.error(
        error.response?.data?.message ||
          "Cannot delete spot with active or upcoming bookings."
      );
    } finally {
      setDeletingSpotId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-2">
        <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#334155]">Loading your host dashboard...</p>
      </div>
    );
  }

  const totalEarnings = spots.reduce(
    (sum, s) => sum + (s.totalEarnings || 0),
    0
  );
  const totalBookingsCount = spots.reduce(
    (sum, s) => sum + (s.totalBookings || 0),
    0
  );
  const activeSpacesCount = spots.filter((s) => s.isAvailable).length;
  const ratedSpots = spots.filter((s) => s.rating > 0);
  const avgRating =
    ratedSpots.length > 0
      ? ratedSpots.reduce((acc, s) => acc + s.rating, 0) / ratedSpots.length
      : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20 space-y-6">
      {/* ── HEADER & ACTIONS ───────────────────────────────────── */}
      <PageHeader
        title={`Welcome, ${userInfo?.username || "Host Partner"}`}
        description="Monitor space occupancy, edit pricing, toggle availability, and track incoming reservations."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Host Dashboard" },
        ]}
        action={
          <Button variant="primary" size="sm" href="/host/add-spot">
            <PlusCircle size={15} />
            <span>List New Space</span>
          </Button>
        }
      />

      {/* ── 4-STAT METRICS GRID ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card padding="default">
          <span className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider block">
            Gross Earnings
          </span>
          <p className="text-xl sm:text-2xl font-bold text-[#0F172A] mt-1">
            ${totalEarnings.toFixed(2)}
          </p>
        </Card>

        <Card padding="default">
          <span className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider block">
            Total Reservations
          </span>
          <p className="text-xl sm:text-2xl font-bold text-[#0F172A] mt-1">
            {totalBookingsCount}
          </p>
        </Card>

        <Card padding="default">
          <span className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider block">
            Active Spaces
          </span>
          <p className="text-xl sm:text-2xl font-bold text-[#0F172A] mt-1">
            {activeSpacesCount} <span className="text-xs text-[#475569] font-medium">/ {spots.length}</span>
          </p>
        </Card>

        <Card padding="default">
          <span className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider block">
            Average Rating
          </span>
          <p className="text-xl sm:text-2xl font-bold text-[#0F172A] mt-1 flex items-center gap-1">
            <Star size={18} className="fill-amber-400 text-amber-400" />
            <span>{avgRating ? avgRating.toFixed(1) : "New"}</span>
          </p>
        </Card>
      </div>

      {/* ── TAB SELECTOR ───────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-2 border-b border-[#DDE3EA]">
        <Tabs
          tabs={[
            { id: "listings", label: `My Parking Listings (${spots.length})` },
            { id: "bookings", label: `Driver Reservations (${bookings.length})` },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* ── TAB 1: LISTINGS ─────────────────────────────────────── */}
      {activeTab === "listings" && (
        <>
          {spots.length === 0 ? (
            <EmptyState
              icon={Car}
              title="No Parking Listings Yet"
              description="Monetize your driveway or parking bay by creating your first listing."
              actionLabel="List Your First Space"
              actionHref="/host/add-spot"
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {spots.map((spot) => (
                <Card
                  key={spot._id}
                  padding="default"
                  className="flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          spot.spotType === "operator"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-emerald-50 text-[#16845B] border border-emerald-200"
                        }`}
                      >
                        {spot.spotType === "operator" ? "Commercial Hub" : "Peer-to-Peer"}
                      </span>
                      <div className="flex items-center gap-1 text-amber-600 text-xs font-semibold">
                        <Star size={13} className="fill-amber-400" />
                        <span>{spot.rating ? spot.rating.toFixed(1) : "New"}</span>
                      </div>
                    </div>

                    <h3 className="font-semibold text-sm text-[#0F172A] truncate">
                      {spot.title || spot.address}
                    </h3>
                    <p className="text-xs text-[#334155] truncate flex items-start gap-1 font-normal">
                      <MapPin size={13} className="text-[#2563EB] shrink-0 mt-0.5" />
                      <span>{spot.address}</span>
                    </p>

                    {/* Amenity Badges */}
                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
                      {spot.vehicleSize && spot.vehicleSize !== "any" && (
                        <span className="bg-[#F1F5F9] text-[#475569] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                          {spot.vehicleSize.toUpperCase()}
                        </span>
                      )}
                      {spot.amenities?.includes("covered") && (
                        <span className="bg-blue-50 text-[#2563EB] px-1.5 py-0.5 rounded border border-blue-200">
                          Covered
                        </span>
                      )}
                      {spot.amenities?.includes("ev_charging") && (
                        <span className="bg-emerald-50 text-[#16845B] px-1.5 py-0.5 rounded border border-emerald-200">
                          EV
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    {/* Performance Metrics Box */}
                    <div className="bg-[#F8FAFC] rounded-lg p-2.5 border border-[#E2E8F0] grid grid-cols-3 gap-2 text-center text-xs mt-3 mb-3">
                      <div>
                        <span className="text-[#475569] text-[10px] font-medium block">Rate</span>
                        <span className="font-semibold text-[#0F172A]">${spot.pricePerHour}/hr</span>
                      </div>
                      <div>
                        <span className="text-[#475569] text-[10px] font-medium block">Bookings</span>
                        <span className="font-semibold text-[#0F172A]">{spot.totalBookings || 0}</span>
                      </div>
                      <div>
                        <span className="text-[#475569] text-[10px] font-medium block">Earnings</span>
                        <span className="font-semibold text-[#16845B]">
                          ${spot.totalEarnings?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="pt-2.5 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                      {/* Availability Quick Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(spot)}
                        disabled={togglingSpotId === spot._id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                          spot.isAvailable
                            ? "bg-[#ECFDF5] text-[#16845B] hover:bg-emerald-100 border border-[#A7F3D0]"
                            : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] border border-[#CBD5E1]"
                        }`}
                        title={spot.isAvailable ? "Click to pause listing" : "Click to activate listing"}
                      >
                        <Power size={11} />
                        <span>
                          {togglingSpotId === spot._id
                            ? "Updating..."
                            : spot.isAvailable
                            ? "Active"
                            : "Paused"}
                        </span>
                      </button>

                      <div className="flex items-center gap-1">
                        <Link
                          to={`/spots/${spot._id}`}
                          className="p-1.5 text-[#475569] hover:text-[#2563EB] transition rounded hover:bg-[#F1F5F9]"
                          title="View public listing page"
                        >
                          <ExternalLink size={14} />
                        </Link>
                        <Link
                          to={`/host/edit-spot/${spot._id}`}
                          className="p-1.5 text-[#475569] hover:text-[#2563EB] transition rounded hover:bg-[#F1F5F9]"
                          title="Edit listing details"
                        >
                          <Edit3 size={14} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteSpot(spot._id)}
                          disabled={deletingSpotId === spot._id}
                          className="p-1.5 text-[#475569] hover:text-[#DC4545] transition rounded hover:bg-rose-50 cursor-pointer"
                          title="Delete listing"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: INCOMING DRIVER RESERVATIONS ─────────────────── */}
      {activeTab === "bookings" && (
        <Card padding="none" className="overflow-hidden">
          {bookings.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#334155]">
              <Users size={32} className="mx-auto text-[#CBD5E1] mb-2" />
              <p className="font-semibold text-sm text-[#0F172A]">No Driver Reservations Yet</p>
              <p className="text-[#475569] mt-0.5">
                When drivers book your parking spaces, their bookings and schedules will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#334155]">
                <thead className="bg-[#F8FAFC] border-b border-[#DDE3EA] text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Parking Bay</th>
                    <th className="px-4 py-3">Driver</th>
                    <th className="px-4 py-3">Schedule</th>
                    <th className="px-4 py-3">Revenue</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {bookings.map((b) => (
                    <tr key={b._id} className="hover:bg-[#F8FAFC]/60 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#0F172A]">
                          {b.spot?.title || b.spot?.address || "Parking Bay"}
                        </div>
                        <div className="text-[11px] text-[#475569] truncate max-w-xs">
                          {b.spot?.address}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#0F172A]">
                          {b.user?.username || "Driver"}
                        </div>
                        <div className="text-[11px] text-[#475569]">
                          {b.user?.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-[#0F172A]">
                          <Clock size={12} className="text-[#2563EB]" />
                          <span>
                            {new Date(b.startTime).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            {new Date(b.startTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#475569] mt-0.5">
                          until{" "}
                          {new Date(b.endTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#16845B]">
                        ${(b.totalAmount || b.totalCost || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                          {b.paymentStatus === "unpaid_demo" ? "Demo" : b.paymentStatus}
                        </span>
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
        </Card>
      )}
    </div>
  );
}
