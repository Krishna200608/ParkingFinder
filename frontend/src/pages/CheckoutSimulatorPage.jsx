import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { CreditCard, ShieldCheck, Lock, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

export default function CheckoutSimulatorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sessionId = searchParams.get("session_id") || "";
  const bookingId = searchParams.get("booking_id") || "";

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Simulated card form fields
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [rawCardNumber, setRawCardNumber] = useState("4242424242424242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("123");
  const [cardName, setCardName] = useState("Demo Driver");

  useEffect(() => {
    if (!bookingId) {
      toast.error("Missing booking reference");
      navigate("/dashboard");
      return;
    }

    const fetchBooking = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/bookings/me");
        const current = data.find((b) => b._id === bookingId);
        if (current) {
          setBooking(current);
        } else {
          toast.error("Could not find matching reservation");
        }
      } catch (err) {
        console.error("Failed to fetch booking for checkout:", err);
        toast.error("Unable to load booking details");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, navigate]);

  const handleFillStandardTestCard = () => {
    setCardNumber("4242 •••• •••• 4242");
    setRawCardNumber("4242424242424242");
    setCardExpiry("12/28");
    setCardCvc("123");
    setCardName("Demo Driver");
    toast.success("Standard Stripe test credentials populated");
  };

  const handleSimulatePayment = async (e) => {
    e.preventDefault();
    if (!bookingId) return;

    try {
      setProcessing(true);
      const { data } = await axios.post("/api/payments/simulate-success", {
        sessionId,
        bookingId,
        cardNumber: rawCardNumber,
        cardExpiry,
      });

      toast.success("Payment authorized in sandbox!");
      setTimeout(() => {
        navigate(
          `/booking-success?session_id=${data.payment?.stripeSessionId || sessionId}&booking_id=${bookingId}`
        );
      }, 600);
    } catch (err) {
      console.error("Simulation error:", err);
      toast.error(err.response?.data?.message || "Payment simulation failed");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-2">
        <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#334155]">Preparing sandbox checkout session...</p>
      </div>
    );
  }

  const totalAmount = Number(booking?.totalAmount || booking?.totalCost || 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-20 space-y-6">
      {/* Test Mode Banner */}
      <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#D97706]">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-[#D97706]" />
          <div>
            <p className="font-semibold text-[#0F172A]">Stripe Sandbox / Test Mode Simulator</p>
            <p className="text-[#334155] mt-0.5">
              This checkout operates in test mode. No real payment method is charged.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFillStandardTestCard}
          className="bg-white border-[#FDE68A] text-[#D97706] hover:bg-amber-50 shrink-0 text-xs py-1"
        >
          Auto-fill Test Card
        </Button>
      </div>

      <div className="grid md:grid-cols-12 gap-6 bg-white border border-[#DDE3EA] rounded-xl shadow-2xs overflow-hidden">
        {/* Left Column: Order Summary */}
        <div className="md:col-span-5 bg-[#F8FAFC] p-6 border-b md:border-b-0 md:border-r border-[#DDE3EA] flex flex-col justify-between">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center text-xs text-[#475569] hover:text-[#0F172A] mb-5 font-medium gap-1"
            >
              <ArrowLeft size={13} /> Back to My Bookings
            </Link>

            <h2 className="text-base font-bold text-[#0F172A] mb-1">
              Reservation Summary
            </h2>
            <p className="text-xs font-mono text-[#475569] font-medium mb-5">
              Ref: {bookingId.slice(-8)}
            </p>

            <div className="space-y-3.5 text-xs">
              <div className="pb-3 border-b border-[#E2E8F0]">
                <span className="text-[#475569] block mb-0.5">Parking Bay</span>
                <p className="font-semibold text-sm text-[#0F172A]">
                  {booking?.spot?.title || booking?.spot?.address || "Dedicated Space"}
                </p>
                <p className="text-[11px] text-[#334155] mt-0.5">
                  {booking?.spot?.address}
                </p>
              </div>

              <div className="pb-3 border-b border-[#E2E8F0] grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[#475569] block">Duration</span>
                  <span className="font-semibold text-[#0F172A]">
                    {booking?.durationHours} hours
                  </span>
                </div>
                <div>
                  <span className="text-[#475569] block">Hourly Rate</span>
                  <span className="font-semibold text-[#0F172A]">
                    ${booking?.pricePerHourSnapshot || booking?.spot?.pricePerHour}/hr
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1 text-xs text-[#475569]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#0F172A]">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Fee</span>
                  <span className="text-[#16845B] font-medium">$0.00 (Free Tier)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] mt-6">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold text-[#475569]">Total Amount</span>
              <span className="text-2xl font-bold text-[#2563EB]">
                ${totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Simulated Stripe Form */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9] mb-5">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <CreditCard className="text-[#2563EB]" size={16} />
                <span>Simulated Card Authorization</span>
              </h3>
              <Badge variant="neutral" size="sm">
                <Lock size={10} className="mr-1 text-[#16845B]" /> SSL Sandbox
              </Badge>
            </div>

            <form onSubmit={handleSimulatePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                  Card Information
                </label>
                <div className="border border-[#DDE3EA] rounded-lg overflow-hidden focus-within:border-[#2563EB]">
                  <div className="px-3 py-2 bg-white flex items-center border-b border-[#DDE3EA]">
                    <CreditCard className="text-[#475569] mr-2 shrink-0" size={16} />
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => {
                        setCardNumber(e.target.value);
                        setRawCardNumber(e.target.value.replace(/\D/g, ""));
                      }}
                      placeholder="4242 4242 4242 4242"
                      className="w-full text-xs font-mono text-[#0F172A] focus:outline-none"
                      required
                    />
                    <Badge variant="brand" size="sm" className="ml-2">
                      TEST
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-[#DDE3EA]">
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM / YY"
                      className="px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none bg-white"
                      required
                    />
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="CVC"
                      maxLength={4}
                      className="px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Demo Driver"
                  className="w-full border border-[#DDE3EA] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={processing}
                  className="w-full justify-center"
                >
                  <Lock size={14} />
                  <span>
                    {processing
                      ? "Authorizing Sandbox Charge..."
                      : `Authorize Test Payment ($${totalAmount.toFixed(2)})`}
                  </span>
                </Button>
              </div>

              <p className="text-[11px] text-[#475569] font-medium text-center flex items-center justify-center gap-1 pt-1">
                <CheckCircle2 size={12} className="text-[#16845B]" />
                Simulated checkout writes verified booking record to backend.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
