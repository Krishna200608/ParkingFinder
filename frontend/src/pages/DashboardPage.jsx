import React, { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Car,
  X,
  CheckCircle2,
  Receipt,
  RotateCw,
  ArrowUpRight,
  AlertCircle,
  Play,
  Pause,
  Plus,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { Badge, StatusBadge } from "../components/ui/Badge";
import PageHeader from "../components/ui/PageHeader";
import Tabs from "../components/ui/Tabs";
import EmptyState from "../components/ui/EmptyState";
import { CardSkeleton } from "../components/ui/Skeleton";
import CommuterPassModal from "../components/commuter/CommuterPassModal";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") === "commuter" ? "commuter" : "bookings"
  );
  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [commuterPasses, setCommuterPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPasses, setLoadingPasses] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isCommuterModalOpen, setIsCommuterModalOpen] = useState(false);
  const [togglingPassId, setTogglingPassId] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/bookings/me");
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load reservations");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data } = await axios.get("/api/payments/my-transactions");
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Transactions fetch error:", err);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
    try {
      await axios.put(`/api/bookings/${bookingId}/cancel`);
      toast.success("Reservation cancelled successfully");
      setSelectedBooking(null);
      fetchBookings();
    } catch (err) {
      console.error("Cancel booking error:", err);
      toast.error(err.response?.data?.message || "Failed to cancel reservation");
    }
  };

  const handleInitiatePayment = async (bookingId) => {
    try {
      setPayingId(bookingId);
      const { data } = await axios.post("/api/payments/create-checkout-session", {
        bookingId,
      });
      if (data.url) {
        toast.success("Opening Stripe Checkout session...");
        window.location.href = data.url;
      } else {
        toast.error("Failed to generate checkout link");
      }
    } catch (err) {
      console.error("Initiate payment error:", err);
      toast.error(err.response?.data?.message || "Failed to initiate payment");
    } finally {
      setPayingId(null);
    }
  };

  const fetchCommuterPasses = async () => {
    try {
      setLoadingPasses(true);
      const { data } = await axios.get("/api/commuter/my", { withCredentials: true });
      setCommuterPasses(Array.isArray(data.passes) ? data.passes : []);
    } catch (err) {
      console.error("Commuter passes fetch error:", err);
    } finally {
      setLoadingPasses(false);
    }
  };

  const handleTogglePass = async (passId) => {
    try {
      setTogglingPassId(passId);
      const { data } = await axios.put(`/api/commuter/${passId}/toggle`, {}, { withCredentials: true });
      toast.success(data.message || "Pass status modified");
      fetchCommuterPasses();
    } catch (err) {
      console.error("Toggle pass error:", err);
      toast.error(err.response?.data?.message || "Failed to update pass");
    } finally {
      setTogglingPassId(null);
    }
  };

  const handleCancelPass = async (passId) => {
    if (!window.confirm("Cancel this recurring commuter subscription?")) return;
    try {
      await axios.delete(`/api/commuter/${passId}`, { withCredentials: true });
      toast.success("Commuter pass subscription cancelled");
      fetchCommuterPasses();
    } catch (err) {
      console.error("Cancel pass error:", err);
      toast.error(err.response?.data?.message || "Failed to cancel pass");
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchTransactions();
    fetchCommuterPasses();
  }, []);

  const formatTime = (time) =>
    new Date(time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20 space-y-6">
      {/* ── HEADER & TAB CONTROL ───────────────────────────────── */}
      <PageHeader
        title="Driver Dashboard"
        description="Review your active parking reservations, automated commuter passes, and verified Stripe payment receipts."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Driver Dashboard" },
        ]}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-[#DDE3EA]">
        <Tabs
          tabs={[
            { id: "bookings", label: `Reservations (${bookings.length})` },
            { id: "commuter", label: `Commuter Passes (${commuterPasses.length})` },
            { id: "receipts", label: `Payment Receipts (${transactions.length})` },
          ]}
          activeTab={activeTab}
          onChange={(tab) => {
            setActiveTab(tab);
            setSearchParams(tab === "bookings" ? {} : { tab });
          }}
        />

        <div className="flex items-center gap-2">
          {activeTab === "commuter" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCommuterModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Activate Commuter Pass</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchBookings();
              fetchTransactions();
              fetchCommuterPasses();
            }}
            disabled={loading || loadingPasses}
          >
            <RotateCw size={13} className={loading || loadingPasses ? "animate-spin" : ""} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* ── TAB 1: RESERVATIONS ─────────────────────────────────── */}
      {activeTab === "bookings" && (
        <>
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <CardSkeleton count={6} />
            </div>
          ) : bookings.length === 0 ? (
            <EmptyState
              icon={Car}
              title="No Reservations Found"
              description="You have not booked any parking spaces yet. Discover available bays on the map."
              actionLabel="Find Parking Near You"
              actionHref="/find"
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings.map((b) => {
                const isPaid = b.paymentStatus === "paid";
                const isCancelled = b.status === "cancelled";

                return (
                  <Card
                    key={b._id}
                    padding="default"
                    className="flex flex-col justify-between"
                  >
                    <div>
                      {/* Status Row */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-[#0F172A] truncate">
                            {b.spot?.title || b.spot?.address || "Parking Bay"}
                          </h3>
                          <p className="text-xs text-[#334155] truncate mt-0.5">
                            {b.spot?.address}
                          </p>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>

                      {/* Time Details Box */}
                      <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 text-xs text-[#334155] mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={13} className="text-[#2563EB] shrink-0" />
                          <span>
                            {new Date(b.startTime).toLocaleDateString(undefined, {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={13} className="text-[#2563EB] shrink-0" />
                          <span>
                            {formatTime(b.startTime)} – {formatTime(b.endTime)} ({b.durationHours} hrs)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary & Actions */}
                    <div>
                      <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9] text-xs">
                        <div>
                          {isPaid ? (
                            <Badge variant="success" size="sm">
                              <CheckCircle2 size={11} className="mr-1" /> Paid
                            </Badge>
                          ) : b.paymentStatus === "pending" ? (
                            <Badge variant="warning" size="sm">
                              Pending
                            </Badge>
                          ) : (
                            <Badge variant="brand" size="sm">
                              Demo Reserved
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-[#475569] font-medium block">
                            ${b.spot?.pricePerHour || b.pricePerHourSnapshot || 0}/hr
                          </span>
                          <span className="text-base font-bold text-[#0F172A]">
                            ${(b.totalAmount || b.totalCost || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] flex flex-wrap items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs py-1 px-2.5 text-[#475569]"
                          onClick={() => setSelectedBooking(b)}
                        >
                          Details
                        </Button>

                        {!isCancelled && !isPaid && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs py-1 px-2.5"
                            onClick={() => handleInitiatePayment(b._id)}
                            disabled={payingId === b._id}
                          >
                            <CreditCard size={12} />
                            <span>{payingId === b._id ? "Opening..." : "Pay with Stripe"}</span>
                          </Button>
                        )}

                        {!isCancelled && b.status !== "completed" && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="text-xs py-1 px-2"
                            onClick={() => handleCancelBooking(b._id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: COMMUTER PASSES ──────────────────────────── */}
      {activeTab === "commuter" && (
        <div className="space-y-4">
          {/* Commuter Intro Banner */}
          <Card className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="brand" size="sm">
                    Automated Scheduler
                  </Badge>
                  <span className="text-xs font-bold text-blue-800">15% Commuter Discount</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Recurring Weekday Commuter Subscriptions
                </h3>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  Our Vercel Cron engine evaluates active commuter passes daily at 18:00 UTC and automatically creates confirmed reservations for your commute schedule. Pause, resume, or cancel anytime.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCommuterModalOpen(true)}
                className="shrink-0 flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Activate Commuter Pass</span>
              </Button>
            </div>
          </Card>

          {loadingPasses ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <CardSkeleton count={2} />
            </div>
          ) : commuterPasses.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No Active Commuter Passes"
              description="Eliminate the hassle of daily booking. Set up a recurring schedule for your regular workplace or transit hub."
              actionLabel="Activate Commuter Pass"
              onAction={() => setIsCommuterModalOpen(true)}
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {commuterPasses.map((pass) => {
                const daysMap = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 0: "Sun" };
                const daysText =
                  pass.daysOfWeek.length === 5 && [1, 2, 3, 4, 5].every((d) => pass.daysOfWeek.includes(d))
                    ? "Mon – Fri (Weekdays)"
                    : pass.daysOfWeek.map((d) => daysMap[d]).join(", ");

                return (
                  <Card key={pass._id} className="p-4 flex flex-col justify-between border border-[#DDE3EA] space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            to={`/spots/${pass.spot?._id}`}
                            className="font-bold text-sm text-slate-900 hover:text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <span>{pass.spot?.title || "Reserved Bay"}</span>
                            <ArrowUpRight size={13} />
                          </Link>
                          <p className="text-xs text-slate-500 truncate max-w-xs">{pass.spot?.address}</p>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            pass.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {pass.status}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-1.5 border border-slate-200">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Calendar size={13} className="text-blue-600 shrink-0" />
                          <span className="font-semibold">{daysText}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Clock size={13} className="text-slate-400 shrink-0" />
                          <span>
                            {pass.startTime} – {pass.endTime} ({pass.durationHours} hrs/day)
                          </span>
                        </div>
                      </div>

                      {pass.conflictCount > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-md border border-amber-200">
                          <AlertCircle size={13} className="shrink-0 text-amber-600" />
                          <span>{pass.conflictCount} scheduling collision detected in history</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-base font-bold text-slate-900">${pass.dailyCost?.toFixed(2)}</span>
                          <span className="text-[11px] text-slate-500">/day</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            15% OFF
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">Base: ${pass.hourlyRateSnapshot}/hr</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          loading={togglingPassId === pass._id}
                          onClick={() => handleTogglePass(pass._id)}
                          className="text-xs py-1 px-2.5"
                        >
                          {pass.status === "active" ? (
                            <>
                              <Pause size={12} className="mr-1" /> Pause
                            </>
                          ) : (
                            <>
                              <Play size={12} className="mr-1" /> Resume
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelPass(pass._id)}
                          className="text-xs py-1 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: TRANSACTIONS & RECEIPTS ────────────────────── */}
      {activeTab === "receipts" && (
        <Card padding="none" className="overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#DDE3EA]">
            <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <Receipt className="text-[#2563EB]" size={18} />
              <span>Payment Receipts</span>
            </h2>
            <p className="text-xs text-[#334155] mt-0.5">
              Verified financial transactions executed through Stripe Sandbox & Checkout Simulator.
            </p>
          </div>

          {transactions.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#334155]">
              <Receipt size={32} className="mx-auto text-[#CBD5E1] mb-2" />
              <p className="font-semibold text-[#0F172A]">No payment transactions recorded</p>
              <p className="text-[#475569] mt-0.5">
                Complete payment on any reserved booking to view receipts here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#334155]">
                <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#475569] uppercase tracking-wider border-b border-[#DDE3EA]">
                  <tr>
                    <th className="py-2.5 px-4">Transaction Reference</th>
                    <th className="py-2.5 px-4">Parking Bay</th>
                    <th className="py-2.5 px-4">Amount</th>
                    <th className="py-2.5 px-4">Mode</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {transactions.map((txn) => (
                    <tr key={txn._id} className="hover:bg-[#F8FAFC]/60 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-[#0F172A]">
                        {txn.stripePaymentIntentId || txn.stripeSessionId || txn._id}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#0F172A]">
                        {txn.booking?.spot?.title || txn.booking?.spot?.address || "Dedicated Bay"}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#16845B]">
                        ${Number(txn.amount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]">
                          {txn.mode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#334155]">
                        {new Date(txn.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={txn.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── RESERVATION DETAILS DIALOG ────────────────────────── */}
      {selectedBooking && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-[#0F172A]/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-[#DDE3EA] overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center px-5 py-4 border-b border-[#DDE3EA]">
              <h3 className="font-bold text-sm text-[#0F172A]">
                Reservation Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="text-[#475569] hover:text-[#0F172A] p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#475569] block mb-1">
                  Location
                </span>
                <p className="font-semibold text-sm text-[#0F172A]">
                  {selectedBooking.spot?.address}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                <div>
                  <span className="text-[11px] text-[#475569] block">Duration</span>
                  <span className="font-semibold text-[#0F172A]">
                    {selectedBooking.durationHours} hours
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#475569] block">Hourly Rate</span>
                  <span className="font-semibold text-[#0F172A]">
                    ${selectedBooking.pricePerHourSnapshot || selectedBooking.spot?.pricePerHour}/hr
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#475569] block">Start</span>
                  <span className="font-semibold text-[#0F172A]">
                    {formatTime(selectedBooking.startTime)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#475569] block">End</span>
                  <span className="font-semibold text-[#0F172A]">
                    {formatTime(selectedBooking.endTime)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[11px] text-[#475569] block">Payment Status</span>
                  <div className="mt-0.5">
                    {selectedBooking.paymentStatus === "paid" ? (
                      <span className="text-[#16845B] font-bold flex items-center gap-1">
                        <CheckCircle2 size={13} /> Paid (${(selectedBooking.totalAmount || selectedBooking.totalCost || 0).toFixed(2)})
                      </span>
                    ) : (
                      <span className="text-[#2563EB] font-bold">Demo Reserved (Unpaid)</span>
                    )}
                  </div>
                </div>

                {selectedBooking.status !== "cancelled" && selectedBooking.paymentStatus !== "paid" && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedBooking(null);
                      handleInitiatePayment(selectedBooking._id);
                    }}
                  >
                    <CreditCard size={13} /> Pay with Stripe
                  </Button>
                )}
              </div>

              {selectedBooking.spot?._id && (
                <div className="pt-2 border-t border-[#F1F5F9]">
                  <Link
                    to={`/spots/${selectedBooking.spot._id}`}
                    className="text-xs text-[#2563EB] hover:underline font-semibold flex items-center gap-1"
                  >
                    View Parking Space & Leave Verified Review <ArrowUpRight size={13} />
                  </Link>
                </div>
              )}

              {/* Location Map */}
              {selectedBooking.spot?.location?.coordinates && (
                <div>
                  <span className="text-[11px] font-semibold text-[#475569] block mb-1">
                    Map Overview
                  </span>
                  <div className="h-36 rounded-lg overflow-hidden border border-[#DDE3EA]">
                    <MapContainer
                      center={[
                        selectedBooking.spot.location.coordinates[1],
                        selectedBooking.spot.location.coordinates[0],
                      ]}
                      zoom={15}
                      style={{ height: "100%", width: "100%" }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://openstreetmap.org">OSM</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker
                        position={[
                          selectedBooking.spot.location.coordinates[1],
                          selectedBooking.spot.location.coordinates[0],
                        ]}
                      >
                        <Popup>
                          <strong>{selectedBooking.spot.address}</strong>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-[#DDE3EA] bg-[#F8FAFC] flex justify-end gap-2">
              {selectedBooking.status !== "cancelled" && selectedBooking.status !== "completed" && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleCancelBooking(selectedBooking._id)}
                >
                  Cancel Reservation
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Commuter Pass Activation Modal */}
      <CommuterPassModal
        isOpen={isCommuterModalOpen}
        onClose={(success) => {
          setIsCommuterModalOpen(false);
          if (success) fetchCommuterPasses();
        }}
      />
    </div>
  );
}
