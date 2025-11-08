import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

/**
 * Fixes the Leaflet map resize issue when rendered inside a modal
 */
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

/**
 * BookingModal contract:
 * props:
 *   - spot: object (spot to book)
 *   - onClose(success:boolean): callback when modal closes; if booking succeeded, success=true
 */
const BookingModal = ({ spot, onClose }) => {
  const { userInfo } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [hours, setHours] = useState(1);
  const [notes, setNotes] = useState("");

  const totalPrice = (spot.pricePerHour || 0) * hours;

  const handleBook = async () => {
    if (!userInfo) {
      toast.error("Please login to book");
      onClose(false);
      return;
    }
    try {
      setIsLoading(true);
      const payload = {
        spotId: spot._id || spot.id,
        hours,
        notes,
      };
      await axios.post("/api/bookings", payload);
      toast.success("Booked successfully!");
      onClose(true);
    } catch (err) {
      console.error("Booking failed", err);
      toast.error(err?.response?.data?.message || "Booking failed");
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

        {/* ✅ Small map preview */}
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

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-500">Hours</label>
            <input
              type="number"
              min="1"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Price</label>
            <div className="py-2 font-medium">{`$${totalPrice.toFixed(2)}`}</div>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs text-gray-500">Notes (optional)</label>
          <textarea
            rows="3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="Any instructions for the host"
          />
        </div>

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
            disabled={isLoading}
          >
            {isLoading ? "Booking..." : `Pay & Book $${totalPrice.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
