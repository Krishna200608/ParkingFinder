import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

/** Fixes map size in modal **/
function MapFixer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
      map.flyTo(map.getCenter(), map.getZoom());
    }, 250);
  }, [map]);
  return null;
}

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const BookingModal = ({ spot, onClose }) => {
  const { userInfo } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);

  // Merge date and time → full Date object
  const getDateTime = (date, time) => {
    if (!date || !time) return null;
    return new Date(`${date}T${time}`);
  };

  // Price & Validation
  useEffect(() => {
    const start = getDateTime(startDate, startTime);
    const end = getDateTime(endDate, endTime);

    if (!start || !end || !spot?.pricePerHour) {
      setTotalPrice(0);
      return;
    }

    // ✅ Validate that start < end
    if (end <= start) {
      setTotalPrice(0);
      toast.error("End time must be after start time");
      return;
    }

    const diffHours = (end - start) / (1000 * 60 * 60);
    if (diffHours > 0) {
      setTotalPrice(Math.round(diffHours * spot.pricePerHour * 100) / 100);
    } else {
      setTotalPrice(0);
    }
  }, [startDate, startTime, endDate, endTime, spot]);

  const handleBook = async () => {
    if (!userInfo) {
      toast.error("Please login to book");
      onClose(false);
      return;
    }

    const start = getDateTime(startDate, startTime);
    const end = getDateTime(endDate, endTime);

    if (!start || !end) {
      toast.error("Please select both start and end times");
      return;
    }

    if (end <= start) {
      toast.error("End time must be after start time");
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        spotId: spot._id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        notes,
      };

      await axios.post("/api/bookings", payload);
      toast.success("Booked successfully!");
      onClose(true);
    } catch (err) {
      console.error("Booking failed", err);
      const msg =
        err?.response?.data?.message ||
        "Booking failed. Please choose a different time slot.";
      toast.error(msg);
      onClose(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-lg relative">
        <h3 className="text-lg font-semibold mb-2">Reserve Spot</h3>
        <p className="text-sm text-gray-600 mb-4">{spot.address || spot.name}</p>

        {/* Map Preview */}
        {spot?.location?.coordinates && (
          <div className="mb-4 rounded overflow-hidden shadow-sm">
            <MapContainer
              center={[
                spot.location.coordinates[1],
                spot.location.coordinates[0],
              ]}
              zoom={15}
              style={{ height: "250px", width: "100%" }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
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

        {/* 📅 Date Selection */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-500">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>
        </div>

        {/* 🕓 Time Selection */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-500">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              step="900" // 15-minute steps
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              step="900"
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>
        </div>

        {/* 💰 Price and Notes */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-500">Price</label>
            <div className="py-2 font-medium">
              ${totalPrice ? totalPrice.toFixed(2) : "0.00"}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Notes (optional)</label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              placeholder="Any instructions for the host"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => onClose(false)}
            className="px-4 py-2 rounded border hover:bg-gray-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleBook}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={isLoading || totalPrice === 0}
          >
            {isLoading ? "Booking..." : `Book $${totalPrice.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
