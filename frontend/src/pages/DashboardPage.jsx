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
  ShieldCheck,
  RotateCw,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const DashboardPage = () => {
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
      toast.error("Unable to load your bookings");
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
      toast.error(err.response?.data?.message || "Failed to cancel booking");
    }
  };

  const handleInitiatePayment = async (bookingId) => {
    try {
      setPayingId(bookingId);
      const { data } = await axios.post("/api/payments/create-checkout-session", {
        bookingId,
      });
      if (data.url) {
        toast.success("Redirecting to checkout session...");
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
    new Date(time).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-12 text-center shadow-md">
        <h1 className="text-3xl font-extrabold mb-2">Driver Dashboard</h1>
        <p className="text-blue-100 text-sm max-w-md mx-auto">
          Manage your reserved parking spots and inspect verified payment receipts.
        </p>

        {/* Tab Switcher */}
        <div className="flex justify-center gap-3 mt-6">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2 ${
              activeTab === "bookings"
                ? "bg-white text-blue-600 shadow"
                : "bg-blue-700/50 text-white hover:bg-blue-700"
            }`}
          >
            <Car size={16} /> My Reservations ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("receipts")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2 ${
              activeTab === "receipts"
                ? "bg-white text-blue-600 shadow"
                : "bg-blue-700/50 text-white hover:bg-blue-700"
            }`}
          >
            <Receipt size={16} /> Transactions ({transactions.length})
          </button>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 mt-10">
        {activeTab === "bookings" && (
          <>
            {loading ? (
              <div className="text-center text-gray-500 py-20 text-lg">
                Loading your bookings...
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center text-gray-600 max-w-md mx-auto">
                <Car size={44} className="mx-auto mb-3 text-blue-500" />
                <h3 className="text-xl font-bold mb-1 text-gray-800">No Reservations Yet</h3>
                <p className="text-sm text-gray-500 mb-6">
                  You have not reserved any parking bays yet. Explore live spots nearby and get started!
                </p>
                <Link
                  to="/find"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition inline-block text-sm"
                >
                  Find Parking Nearby
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookings.map((b) => (
                  <div
                    key={b._id}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 p-6 flex flex-col justify-between"
                  >
                    {/* Header Info */}
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-base text-gray-800 flex items-center gap-2 line-clamp-1">
                          <MapPin size={16} className="text-blue-500 flex-shrink-0" />
                          {b.spot?.title || b.spot?.address || "Unknown address"}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${
                            b.status === "confirmed"
                              ? "bg-blue-100 text-blue-700"
                              : b.status === "active"
                              ? "bg-green-100 text-green-700"
                              : b.status === "cancelled"
                              ? "bg-red-100 text-red-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mb-3 line-clamp-1">
                        {b.spot?.address}
                      </p>

                      {/* Time Info */}
                      <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl mb-3">
                        <p className="flex items-center gap-2">
                          <Calendar size={14} className="text-blue-500" />
                          <span>
                            {new Date(b.startTime).toLocaleDateString("en-US", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </p>

                        <p className="flex items-center gap-2">
                          <Clock size={14} className="text-blue-500" />
                          <span>
                            {formatTime(b.startTime)} - {formatTime(b.endTime)} ({b.durationHours} hrs)
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div>
                      <div className="border-t border-gray-100 my-3"></div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-1.5">
                          {b.paymentStatus === "paid" ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
                              <CheckCircle2 size={12} /> Paid
                            </span>
                          ) : b.paymentStatus === "pending" ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                              <RotateCw size={12} className="animate-spin" /> Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                              <ShieldCheck size={12} /> Demo Reserved
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-gray-400 text-[11px]">
                            ${b.spot?.pricePerHour || b.pricePerHourSnapshot || 0}/hr
                          </p>
                          <p className="font-bold text-blue-600 text-base">
                            ${(b.totalAmount || b.totalCost || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex flex-wrap justify-end items-center gap-2 pt-2 border-t border-gray-50">
                        {b.status !== "cancelled" && b.status !== "completed" && (
                          <button
                            onClick={() => handleCancelBooking(b._id)}
                            className="text-xs border border-red-200 text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition"
                          >
                            Cancel
                          </button>
                        )}

                        {b.status !== "cancelled" && b.paymentStatus !== "paid" && (
                          <button
                            onClick={() => handleInitiatePayment(b._id)}
                            disabled={payingId === b._id}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm disabled:bg-blue-400"
                          >
                            <CreditCard size={13} />
                            {payingId === b._id ? "Opening..." : "Pay with Stripe"}
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-1.5 rounded-lg transition"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Tab 2: Transactions & Receipts */}
        {activeTab === "receipts" && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
              <Receipt className="text-blue-600" size={22} /> Payment Transactions
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Verified financial records from Stripe Test Mode and Sandbox checkouts.
            </p>

            {transactions.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <CreditCard size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="font-medium">No payment transactions found</p>
                <p className="text-xs text-gray-400 mt-1">
                  Complete checkout on any of your active bookings to see receipts here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4">Transaction / Intent ID</th>
                      <th className="py-3 px-4">Parking Bay</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Method / Mode</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map((txn) => (
                      <tr key={txn._id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-mono text-xs text-gray-800 font-medium">
                          {txn.stripePaymentIntentId || txn.stripeSessionId || txn._id}
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-gray-800">
                          {txn.booking?.spot?.title || txn.booking?.spot?.address || "Dedicated Spot"}
                        </td>
                        <td className="py-3 px-4 text-xs font-bold text-green-600">
                          ${Number(txn.amount || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-xs capitalize text-gray-500">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px] font-mono">
                            {txn.mode}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500">
                          {new Date(txn.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                            <CheckCircle2 size={12} /> {txn.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 flex justify-center items-center z-50 p-4 bg-black/40 backdrop-blur-sm"
          role="dialog"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 animate-slideUp">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-800">Reservation Details</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Address</p>
                <p className="font-semibold text-gray-800">{selectedBooking.spot?.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3.5 rounded-xl text-xs">
                <div>
                  <p className="text-gray-400">Duration</p>
                  <p className="font-semibold text-gray-800">{selectedBooking.durationHours} hours</p>
                </div>
                <div>
                  <p className="text-gray-400">Rate</p>
                  <p className="font-semibold text-gray-800">
                    ${selectedBooking.pricePerHourSnapshot || selectedBooking.spot?.pricePerHour}/hr
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Start</p>
                  <p className="font-semibold text-gray-800">{formatTime(selectedBooking.startTime)}</p>
                </div>
                <div>
                  <p className="text-gray-400">End</p>
                  <p className="font-semibold text-gray-800">{formatTime(selectedBooking.endTime)}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div>
                  <p className="text-xs text-gray-400">Payment Status</p>
                  <p className="font-medium">
                    {selectedBooking.paymentStatus === "paid" ? (
                      <span className="text-green-600 font-bold flex items-center gap-1">
                        <CheckCircle2 size={14} /> Paid (${(selectedBooking.totalAmount || selectedBooking.totalCost || 0).toFixed(2)})
                      </span>
                    ) : (
                      <span className="text-blue-600 font-bold">Demo Reserved (Unpaid)</span>
                    )}
                  </p>
                </div>
                {selectedBooking.status !== "cancelled" && selectedBooking.paymentStatus !== "paid" && (
                  <button
                    onClick={() => {
                      setSelectedBooking(null);
                      handleInitiatePayment(selectedBooking._id);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow"
                  >
                    <CreditCard size={14} /> Pay with Stripe
                  </button>
                )}
              </div>

              {selectedBooking.spot?._id && (
                <div className="pt-2 border-t border-gray-100">
                  <Link
                    to={`/spots/${selectedBooking.spot._id}`}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    → View Parking Space Details & Leave a Review
                  </Link>
                </div>
              )}

              {/* Map */}
              {selectedBooking.spot?.location?.coordinates && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">Location Map</p>
                  <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
                    <MapContainer
                      center={[
                        selectedBooking.spot.location.coordinates[1],
                        selectedBooking.spot.location.coordinates[0],
                      ]}
                      zoom={15}
                      style={{ height: "200px", width: "100%" }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
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

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              {selectedBooking.status !== "cancelled" && selectedBooking.status !== "completed" && (
                <button
                  onClick={() => handleCancelBooking(selectedBooking._id)}
                  className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-4 py-2 rounded-xl transition"
                >
                  Cancel Reservation
                </button>
              )}
              <button
                onClick={() => setSelectedBooking(null)}
                className="bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
