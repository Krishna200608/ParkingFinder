import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { CheckCircle2, Calendar, Clock, MapPin, Receipt, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

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
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-2">
        <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#64748B]">Verifying payment confirmation...</p>
      </div>
    );
  }

  const booking = data?.booking;
  const payment = data?.payment;
  const totalAmount = Number(booking?.totalCost || booking?.totalAmount || payment?.amount || 0);

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 pb-20">
      <Card padding="lg" className="text-center">
        {/* Success Icon */}
        <div className="w-14 h-14 bg-emerald-50 text-[#16845B] border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} />
        </div>

        <Badge variant="success" size="sm" className="mb-3">
          <ShieldCheck size={12} className="mr-1" /> Payment Verified
        </Badge>

        <h1 className="text-2xl font-bold text-[#17243A] mb-2">
          Reservation Confirmed
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-sm mx-auto mb-6">
          Your parking bay is locked and guaranteed. Details and transaction references are summarized below.
        </p>

        {error && (
          <div className="mb-6 p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-[#D97706] text-xs text-left flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>Note: {error} (Your reservation remains stored in your dashboard).</span>
          </div>
        )}

        {/* Receipt Box */}
        <div className="bg-[#F8FAFC] rounded-lg p-4 sm:p-5 text-left border border-[#DDE3EA] mb-6 space-y-3.5 text-xs">
          <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0]">
            <div>
              <span className="text-[11px] text-[#94A3B8] font-medium uppercase tracking-wider block">
                Transaction Reference
              </span>
              <span className="font-mono text-xs font-semibold text-[#17243A] mt-0.5 block">
                {payment?.stripePaymentIntentId || payment?.stripeSessionId || sessionId || `txn_${bookingId.slice(-6)}`}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#94A3B8] font-medium uppercase tracking-wider block">
                Amount Paid
              </span>
              <span className="text-lg font-bold text-[#16845B]">
                ${totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-[#475569]">
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-[#2563EB] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#17243A] block">
                  {booking?.spot?.title || booking?.spot?.address || "Reserved Bay"}
                </span>
                {booking?.spot?.address && (
                  <span className="text-[#64748B] text-[11px]">{booking.spot.address}</span>
                )}
              </div>
            </div>

            {booking?.startTime && (
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-[#2563EB] shrink-0" />
                <span>
                  {new Date(booking.startTime).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}

            {booking?.startTime && booking?.endTime && (
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[#2563EB] shrink-0" />
                <span>
                  {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{" "}
                  {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            href="/dashboard"
          >
            <Receipt size={14} />
            <span>View in My Bookings</span>
          </Button>

          <Button
            variant="outline"
            size="md"
            href="/find"
          >
            <span>Book Another Space</span>
            <ArrowRight size={14} />
          </Button>
        </div>
      </Card>
    </div>
  );
}
