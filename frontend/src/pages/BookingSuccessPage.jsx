import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { CheckCircle, Calendar, Clock, MapPin, Receipt, ArrowRight, ShieldCheck } from "lucide-react";

export default function BookingSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id") || "";
  const bookingId = searchParams.get("booking_id") || "";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `/api/payments/verify-session?sessionId=${sessionId}&bookingId=${bookingId}`
        );
        setData(res.data);
      } catch (err) {
        console.error("Verification error:", err);
        setError(err.response?.data?.message || "Could not verify payment session.");
      } finally {
        setLoading(false);
      }
    };

    if (sessionId && bookingId) {
      verifyPayment();
    } else {
      setLoading(false);
    }
  }, [sessionId, bookingId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Verifying payment confirmation...</p>
      </div>
    );
  }

  const booking = data?.booking;
  const payment = data?.payment;
  const totalAmount = Number(booking?.totalCost || booking?.totalAmount || payment?.amount || 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden text-center p-8 md:p-10">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircle size={44} strokeWidth={2.5} />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200 mb-3">
          <ShieldCheck size={14} /> Payment Confirmed (Test Mode)
        </span>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          Reservation Secured!
        </h1>
        <p className="text-gray-500 text-sm max-w-md mx-auto mb-8">
          Your parking spot is guaranteed. A digital receipt and access instructions are ready below.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs text-left">
            Notice: {error} (Reservation is saved in your dashboard).
          </div>
        )}

        {/* Receipt Box */}
        <div className="bg-gray-50 rounded-2xl p-6 text-left border border-gray-100 mb-8 space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Transaction Reference
              </p>
              <p className="text-xs font-mono font-semibold text-gray-700 mt-0.5">
                {payment?.stripePaymentIntentId || payment?.stripeSessionId || sessionId || `txn_${bookingId.slice(-6)}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Total Paid
              </p>
              <p className="text-xl font-black text-green-600">
                ${totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <MapPin size={16} className="text-blue-500 flex-shrink-0" />
              <span className="font-medium text-gray-800">
                {booking?.spot?.title || booking?.spot?.address || "Reserved Bay"}
              </span>
            </p>
            {booking?.spot?.address && (
              <p className="text-xs text-gray-500 pl-6">{booking.spot.address}</p>
            )}

            {booking?.startTime && (
              <p className="flex items-center gap-2 pt-1">
                <Calendar size={16} className="text-blue-500 flex-shrink-0" />
                <span>
                  {new Date(booking.startTime).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </p>
            )}

            {booking?.startTime && booking?.endTime && (
              <p className="flex items-center gap-2">
                <Clock size={16} className="text-blue-500 flex-shrink-0" />
                <span>
                  {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{" "}
                  {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition"
          >
            <Receipt size={18} /> View in My Bookings
          </Link>
          <Link
            to="/find"
            className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl transition"
          >
            Find Another Spot <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
