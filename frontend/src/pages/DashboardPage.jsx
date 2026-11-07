import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("bookings"); // 'bookings' | 'receipts'
  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

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

  useEffect(() => {
    fetchBookings();
    fetchTransactions();
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
        description="Review your active parking reservations, access instructions, and verified Stripe payment receipts."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Driver Dashboard" },
        ]}
      />

      <div className="flex items-center justify-between pb-2 border-b border-[#DDE3EA]">
        <Tabs
          tabs={[
            { id: "bookings", label: `Reservations (${bookings.length})` },
            { id: "receipts", label: `Payment Receipts (${transactions.length})` },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchBookings();
            fetchTransactions();
          }}
          disabled={loading}
        >
          <RotateCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* ── TAB 1: RESERVATIONS ─────────────────────────────────── */}
      {activeTab === "bookings" && (
        <>
          {loading ? (
            <div className="py-20 text-center text-sm text-[#64748B]">
              <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading your parking reservations...
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
                          <h3 className="font-semibold text-sm text-[#17243A] truncate">
                            {b.spot?.title || b.spot?.address || "Parking Bay"}
                          </h3>
                          <p className="text-xs text-[#64748B] truncate mt-0.5">
                            {b.spot?.address}
                          </p>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>

                      {/* Time Details Box */}
                      <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 text-xs text-[#475569] mb-4">
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
                          <span className="text-[11px] text-[#94A3B8] block">
                            ${b.spot?.pricePerHour || b.pricePerHourSnapshot || 0}/hr
                          </span>
                          <span className="text-base font-bold text-[#17243A]">
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

      {/* ── TAB 2: TRANSACTIONS & RECEIPTS ────────────────────── */}
      {activeTab === "receipts" && (
        <Card padding="none" className="overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#DDE3EA]">
            <h2 className="text-base font-bold text-[#17243A] flex items-center gap-2">
              <Receipt className="text-[#2563EB]" size={18} />
              <span>Payment Receipts</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Verified financial transactions executed through Stripe Sandbox & Checkout Simulator.
            </p>
          </div>

          {transactions.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#64748B]">
              <Receipt size={32} className="mx-auto text-[#CBD5E1] mb-2" />
              <p className="font-medium text-[#17243A]">No payment transactions recorded</p>
              <p className="text-[#94A3B8] mt-0.5">
                Complete payment on any reserved booking to view receipts here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#475569]">
                <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider border-b border-[#DDE3EA]">
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
                      <td className="py-3 px-4 font-mono text-[11px] text-[#17243A]">
                        {txn.stripePaymentIntentId || txn.stripeSessionId || txn._id}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#17243A]">
                        {txn.booking?.spot?.title || txn.booking?.spot?.address || "Dedicated Bay"}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#16845B]">
                        ${Number(txn.amount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                          {txn.mode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#64748B]">
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
          className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-[#17243A]/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-[#DDE3EA] overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center px-5 py-4 border-b border-[#DDE3EA]">
              <h3 className="font-bold text-sm text-[#17243A]">
                Reservation Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="text-[#94A3B8] hover:text-[#17243A] p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1">
                  Location
                </span>
                <p className="font-semibold text-sm text-[#17243A]">
                  {selectedBooking.spot?.address}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                <div>
                  <span className="text-[11px] text-[#64748B] block">Duration</span>
                  <span className="font-semibold text-[#17243A]">
                    {selectedBooking.durationHours} hours
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#64748B] block">Hourly Rate</span>
                  <span className="font-semibold text-[#17243A]">
                    ${selectedBooking.pricePerHourSnapshot || selectedBooking.spot?.pricePerHour}/hr
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#64748B] block">Start</span>
                  <span className="font-semibold text-[#17243A]">
                    {formatTime(selectedBooking.startTime)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#64748B] block">End</span>
                  <span className="font-semibold text-[#17243A]">
                    {formatTime(selectedBooking.endTime)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[11px] text-[#64748B] block">Payment Status</span>
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
                  <span className="text-[11px] font-semibold text-[#64748B] block mb-1">
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
    </div>
  );
}
