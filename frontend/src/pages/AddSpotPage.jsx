import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useAuth } from "../context/AuthContext";
import { MapPin, Loader2 } from "lucide-react";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// 🔹 Reverse geocode helper
const fetchAddress = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await res.json();
    return data.display_name || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
  } catch {
    return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
  }
};

// 🧭 Handles map clicks
function LocationPicker({ setCoordinates, setAddress }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setCoordinates([lat, lng]);
      const addr = await fetchAddress(lat, lng);
      setAddress(addr);
      toast.success("Marker placed at selected location");
    },
  });
  return null;
}

// 🔄 Smooth map animation
function FlyToHelper({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target && map) map.flyTo(target, 14, { duration: 1.2 });
  }, [target, map]);
  return null;
}

const AddSpotPage = () => {
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    spotType: "",
    address: "",
    description: "",
    pricePerHour: "",
  });

  const [radius, setRadius] = useState(5);
  const [coordinates, setCoordinates] = useState(null);
  const [mapCenter, setMapCenter] = useState([28.6139, 77.209]);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);

  const showPreview =
    formData.spotType && formData.address && formData.pricePerHour && coordinates;

  // 📍 Auto center on user’s current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setMapCenter(coords);
        },
        () => toast("Using default location (Delhi)")
      );
    }
  }, []);

  // 🧭 My Location button handler
  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }

    toast.loading("Fetching your location...", { id: "geo" });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const coords = [lat, lng];
        setMapCenter(coords);
        setCoordinates(coords);
        const addr = await fetchAddress(lat, lng);
        setFormData((prev) => ({ ...prev, address: addr }));
        toast.success("Location detected successfully!", { id: "geo" });
      },
      () => toast.error("Unable to retrieve location", { id: "geo" }),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // 🧾 Handle form input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🧱 Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { spotType, address, pricePerHour } = formData;

    if (!spotType || !address || !coordinates || !pricePerHour) {
      toast.error("Please fill all required fields and select a location");
      return;
    }

    const [latitude, longitude] = coordinates;

    try {
      setLoading(true);
      const config = { withCredentials: true, headers: {} };
      if (userInfo?.token)
        config.headers.Authorization = `Bearer ${userInfo.token}`;

      await axios.post(
        "/api/spots/available",
        { ...formData, latitude, longitude },
        config
      );

      toast.success("✅ Parking spot added successfully!");
      navigate("/host/dashboard");
    } catch (err) {
      console.error("Error adding spot:", err);
      toast.error(err.response?.data?.message || "Failed to add parking spot");
    } finally {
      setLoading(false);
    }
  };

  // 🪄 Marker drag update
  const handleMarkerDrag = async (e) => {
    const lat = e.target.getLatLng().lat;
    const lng = e.target.getLatLng().lng;
    const addr = await fetchAddress(lat, lng);
    setCoordinates([lat, lng]);
    setFormData((prev) => ({ ...prev, address: addr }));
    toast("Marker moved — address updated");
  };

  // ✅ Auto resize map when preview appears
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => mapRef.current.invalidateSize(), 400);
      if (coordinates) mapRef.current.flyTo(coordinates, 14, { duration: 0.8 });
    }
  }, [showPreview]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-400 text-white py-10 text-center shadow">
        <h1 className="text-3xl font-bold mb-1">Add New Parking Spot</h1>
        <p className="text-blue-100 text-sm">
          Mark your parking location, set a radius, and list your spot for
          booking.
        </p>
      </section>

      {/* Map + Form Layout */}
      <div className="max-w-7xl mx-auto px-6 mt-10 grid md:grid-cols-2 gap-10">
        {/* Left: Map Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden relative border border-gray-100">
          <div className="p-5 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Select Parking Location
              </h2>
              <p className="text-sm text-gray-500">
                Click anywhere or drag the marker to adjust.
              </p>
            </div>

            {/* Radius Control */}
            <div className="text-sm text-gray-700">
              <label className="block mb-1 text-xs text-gray-500">
                Radius ({radius} km)
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-28 accent-blue-600"
              />
            </div>
          </div>

          {/* My Location Button */}
          <button
            onClick={handleMyLocation}
            className="absolute top-25 left-15 z-40 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-md text-sm flex items-center gap-2"
          >
            <MapPin size={16} /> My Location
          </button>

          {/* Map with dynamic height */}
          <div
            className={`w-full transition-all duration-500 ${
              showPreview ? "h-[60vh]" : "h-[70vh]"
            }`}
          >
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
            >
              <TileLayer
                attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FlyToHelper target={mapCenter} />
              <LocationPicker
                setCoordinates={setCoordinates}
                setAddress={(addr) =>
                  setFormData((prev) => ({ ...prev, address: addr }))
                }
              />
              {coordinates && (
                <>
                  <Marker
                    position={coordinates}
                    draggable
                    eventHandlers={{ dragend: handleMarkerDrag }}
                  />
                  <Circle
                    center={coordinates}
                    radius={radius * 1000}
                    pathOptions={{
                      color: "#2563eb",
                      fillColor: "#3b82f6",
                      fillOpacity: 0.15,
                    }}
                  />
                </>
              )}
            </MapContainer>
          </div>
        </div>

        {/* Right: Form + Live Preview */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 flex flex-col justify-between">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Spot Details
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Spot Type */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Spot Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-5 mt-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="spotType"
                    value="operator"
                    checked={formData.spotType === "operator"}
                    onChange={handleChange}
                    className="accent-blue-600"
                  />
                  Operator (Commercial Lot)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="spotType"
                    value="p2p"
                    checked={formData.spotType === "p2p"}
                    onChange={handleChange}
                    className="accent-blue-600"
                  />
                  P2P (Host-Owned)
                </label>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Click map or drag marker"
                className="w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Latitude
                </label>
                <input
                  type="text"
                  value={coordinates ? coordinates[0].toFixed(5) : ""}
                  readOnly
                  className="w-full border rounded-md py-2 px-3 bg-gray-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Longitude
                </label>
                <input
                  type="text"
                  value={coordinates ? coordinates[1].toFixed(5) : ""}
                  readOnly
                  className="w-full border rounded-md py-2 px-3 bg-gray-100 text-sm"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add details..."
                className="w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              ></textarea>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Price Per Hour ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="pricePerHour"
                step="0.01"
                value={formData.pricePerHour}
                onChange={handleChange}
                className="w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 font-semibold rounded-md text-white flex justify-center items-center gap-2 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } transition`}
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              {loading ? "Adding..." : "Add Parking Spot"}
            </button>

            {/* Live Preview */}
            {showPreview && (
              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  Preview
                  <span className="text-sm text-gray-500 font-normal">
                    (how your spot will appear)
                  </span>
                </h3>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm text-gray-500">
                        {formData.spotType === "operator"
                          ? "Operator Spot"
                          : "P2P (Host-Owned)"}
                      </p>
                      <h4 className="text-lg font-semibold text-gray-800">
                        {formData.address.length > 60
                          ? formData.address.slice(0, 60) + "..."
                          : formData.address}
                      </h4>
                    </div>
                    <div className="text-blue-600 text-lg font-semibold">
                      ${Number(formData.pricePerHour).toFixed(2)}/hr
                    </div>
                  </div>

                  {formData.description && (
                    <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                      {formData.description}
                    </p>
                  )}

                  <div className="text-xs text-gray-500">
                    📍 Latitude: {coordinates[0].toFixed(4)} | Longitude:{" "}
                    {coordinates[1].toFixed(4)}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSpotPage;
