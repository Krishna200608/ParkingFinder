import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { CreditCard, ShieldCheck, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";

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
    toast.success("Standard Stripe test credentials populated!");
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

      toast.success("Payment authorized successfully!");
      setTimeout(() => {
        navigate(`/booking-success?session_id=${data.payment?.stripeSessionId || sessionId}&booking_id=${bookingId}`);
      }, 700);
    } catch (err) {
      console.error("Simulation error:", err);
      toast.error(err.response?.data?.message || "Payment simulation failed");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Preparing test checkout session...</p>
        </div>
      </div>
    );
  }

  const totalAmount = Number(booking?.totalAmount || booking?.totalCost || 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Test Banner */}
      <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-amber-600 w-6 h-6 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">Stripe Sandbox / Test Mode Simulator</p>
            <p className="text-xs text-amber-700">
              This checkout operates in zero-cost test mode. No actual money will be charged to your card.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleFillStandardTestCard}
          className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium px-3 py-1.5 rounded-lg transition"
        >
          Auto-fill Test Card
        </button>
      </div>

      <div className="grid md:grid-cols-12 gap-8 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Left Column: Order Summary */}
        <div className="md:col-span-5 bg-gray-50/70 p-6 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col justify-between">
          <div>
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center text-xs text-gray-500 hover:text-gray-800 mb-6 font-medium gap-1"
            >
              <ArrowLeft size={14} /> Back to My Bookings
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-2">Parking Reservation</h2>
            <p className="text-xs text-gray-500 mb-6 font-mono">ID: {bookingId.slice(-8)}</p>

            <div className="space-y-4 text-sm">
              <div className="pb-4 border-b border-gray-200">
                <p className="text-gray-500 text-xs">Spot Title</p>
                <p className="font-semibold text-gray-800">
                  {booking?.spot?.title || booking?.spot?.address || "Dedicated Bay"}
                </p>
                <p className="text-xs text-gray-500 mt-1">{booking?.spot?.address}</p>
              </div>

              <div className="pb-4 border-b border-gray-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-500">Duration</p>
                  <p className="font-semibold text-gray-800">{booking?.durationHours} hours</p>
                </div>
                <div>
                  <p className="text-gray-500">Rate</p>
                  <p className="font-semibold text-gray-800">
                    ${booking?.pricePerHourSnapshot || booking?.spot?.pricePerHour}/hr
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Subtotal</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Platform Fee (Free Tier)</span>
                  <span className="text-green-600 font-medium">$0.00</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Estimated Tax</span>
                  <span>$0.00</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 mt-6">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-medium text-gray-600">Total Due</span>
              <span className="text-2xl font-black text-blue-600">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Simulated Stripe Payment Form */}
        <div className="md:col-span-7 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <CreditCard className="text-blue-600 w-5 h-5" />
              Payment Details
            </h3>
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              <Lock size={12} className="text-green-600" /> 256-bit SSL Sandbox
            </span>
          </div>

          <form onSubmit={handleSimulatePayment} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Card Information
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                <div className="px-3 py-2.5 bg-white flex items-center border-b border-gray-200">
                  <CreditCard className="text-gray-400 mr-2" size={18} />
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => {
                      setCardNumber(e.target.value);
                      setRawCardNumber(e.target.value.replace(/\D/g, ""));
                    }}
                    placeholder="4242 4242 4242 4242"
                    className="w-full text-sm font-mono text-gray-800 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    TEST
                  </span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-gray-200">
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM / YY"
                    className="px-3 py-2.5 text-sm font-mono text-gray-800 focus:outline-none bg-white"
                    required
                  />
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="CVC"
                    maxLength={4}
                    className="px-3 py-2.5 text-sm font-mono text-gray-800 focus:outline-none bg-white"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Cardholder Name
              </label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Name on card"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={processing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Authorizing Sandbox Charge...
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Authorize Test Payment (${totalAmount.toFixed(2)})
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <CheckCircle2 size={13} className="text-green-500" />
                PCI-DSS Level 1 compliant simulator architecture
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
