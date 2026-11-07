import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { CreditCard, BookmarkCheck, X, Clock, Calendar, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import Button from "../ui/Button";

function MapFixer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      map.flyTo(map.getCenter(), map.getZoom());
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function BookingModal({ spot, onClose }) {
  const { userInfo } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [suggestedSlots, setSuggestedSlots] = useState([]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isLoading) {
        onClose(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isLoading]);

  const getDateTime = (date, time) => {
    if (!date || !time) return null;
    return new Date(`${date}T${time}`);
  };

  useEffect(() => {
    if (!spot?._id) return;
    const fetchSlots = async () => {
      try {
        const queryDate = startDate || new Date().toISOString().split("T")[0];
        const { data } = await axios.get(
          `/api/bookings/spot/${spot._id}/availability?date=${queryDate}`
        );
        setBookedSlots(data.bookedIntervals || []);
        setSuggestedSlots(data.availableSlots?.slice(0, 6) || []);
      } catch (err) {
        console.error("Error fetching availability slots:", err);
      }
    };
    fetchSlots();
  }, [spot, startDate]);

  useEffect(() => {
    const start = getDateTime(startDate, startTime);
    const end = getDateTime(endDate, endTime);

    if (!start || !end || !spot?.pricePerHour) {
      setTotalPrice(0);
      return;
    }

    if (end <= start) {
      setTotalPrice(0);
      return;
    }

    const diffHours = (end - start) / (1000 * 60 * 60);
    setTotalPrice(Math.round(diffHours * spot.pricePerHour * 100) / 100);
  }, [startDate, startTime, endDate, endTime, spot]);

  const isFormValid = () => {
    const start = getDateTime(startDate, startTime);
    const end = getDateTime(endDate, endTime);
    return (
      Boolean(userInfo) &&
      Boolean(start) &&
      Boolean(end) &&
      end > start &&
      totalPrice > 0
    );
  };

  const handleBook = async (payImmediately = false) => {
    if (!isFormValid()) {
      toast.error("Please fill in valid start and end dates/times");
      return;
    }
    try {
      setIsLoading(true);
      const start = getDateTime(startDate, startTime);
      const end = getDateTime(endDate, endTime);

      const { data: booking } = await axios.post("/api/bookings", {
        spotId: spot._id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        notes,
      });

      if (payImmediately && booking?._id) {
        toast.success("Reserved! Initializing Stripe Checkout...");
        const { data: checkout } = await axios.post(
          "/api/payments/create-checkout-session",
          { bookingId: booking._id }
        );
        if (checkout.url) {
          window.location.href = checkout.url;
          return;
        }
      }

      toast.success("Reservation confirmed!");
      onClose(true);
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Booking failed. Please check available hours."
      );
      onClose(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/50 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-[#DDE3EA] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-start px-5 py-4 border-b border-[#DDE3EA] bg-white shrink-0">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">
              Reserve Parking Bay
            </h3>
            <p className="text-xs text-[#334155] truncate max-w-sm mt-0.5">
              {spot.title || spot.address}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onClose(false)}
            className="p-1 rounded text-[#475569] hover:text-[#0F172A] transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 space-y-4">
          {/* Mini-map */}
          {spot?.location?.coordinates && (
            <div className="rounded-lg overflow-hidden border border-[#DDE3EA] h-36 w-full">
              <MapContainer
                center={[
                  spot.location.coordinates[1],
                  spot.location.coordinates[0],
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
                    spot.location.coordinates[1],
                    spot.location.coordinates[0],
                  ]}
                />
                <MapFixer />
              </MapContainer>
            </div>
          )}

          {/* Booked Slots Warning */}
          {bookedSlots.filter((b) => new Date(b.endTime) > new Date()).length > 0 && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-[#DC4545] mb-1">
                <AlertCircle size={14} />
                <span>Reserved Intervals (Occupied):</span>
              </div>
              <ul className="space-y-0.5 text-[#DC4545] text-[11px] max-h-20 overflow-y-auto pl-5 list-disc">
                {bookedSlots
                  .filter((b) => new Date(b.endTime) > new Date())
                  .sort(
                    (a, b) => new Date(a.startTime) - new Date(b.startTime)
                  )
                  .map((b, i) => {
                    const start = new Date(b.startTime);
                    const end = new Date(b.endTime);
                    return (
                      <li key={i}>
                        {start.toLocaleDateString()}:{" "}
                        {start.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        –{" "}
                        {end.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </li>
                    );
                  })}
              </ul>
            </div>
          )}

          {/* Suggested Available Slots */}
          {suggestedSlots.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-[#16845B] block mb-1.5">
                Suggested Open Intervals:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestedSlots.map((slot, idx) => {
                  const start = new Date(slot.start);
                  const end = new Date(slot.end);
                  const pad = (n) => String(n).padStart(2, "0");
                  const dateStr = `${start.getFullYear()}-${pad(
                    start.getMonth() + 1
                  )}-${pad(start.getDate())}`;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setStartDate(dateStr);
                        setEndDate(dateStr);
                        setStartTime(`${pad(start.getHours())}:${pad(start.getMinutes())}`);
                        setEndTime(`${pad(end.getHours())}:${pad(end.getMinutes())}`);
                      }}
                      className="px-2 py-1 rounded bg-[#F8FAFC] border border-[#DDE3EA] hover:border-[#2563EB] hover:text-[#2563EB] text-[11px] font-medium text-[#475569] transition cursor-pointer"
                    >
                      {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date & Time Selectors */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[#475569] font-medium mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-[#DDE3EA] rounded-lg px-2.5 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-[#475569] font-medium mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate || new Date().toISOString().split("T")[0]}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-[#DDE3EA] rounded-lg px-2.5 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[#475569] font-medium mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-[#DDE3EA] rounded-lg px-2.5 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-[#475569] font-medium mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-[#DDE3EA] rounded-lg px-2.5 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          {/* Rate Summary & Notes */}
          <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#475569] block">Hourly Rate</span>
              <span className="text-xs font-semibold text-[#0F172A]">
                ${spot.pricePerHour}/hr
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#475569] block">Total Estimated</span>
              <span className="text-base font-bold text-[#2563EB]">
                ${totalPrice ? totalPrice.toFixed(2) : "0.00"}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#475569] font-medium mb-1">
              Instructions for Host (optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Arriving in silver sedan, license plate ABC-1234"
              className="w-full border border-[#DDE3EA] rounded-lg p-2 text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[#DDE3EA] bg-white flex flex-wrap items-center justify-end gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onClose(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBook(false)}
            disabled={isLoading || !isFormValid()}
            className="text-xs"
          >
            <BookmarkCheck size={14} />
            <span>Reserve (Demo)</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleBook(true)}
            disabled={isLoading || !isFormValid()}
            className="text-xs"
          >
            <CreditCard size={14} />
            <span>{isLoading ? "Processing..." : `Pay with Stripe $${totalPrice.toFixed(2)}`}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
