import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
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
import {
  MapPin,
  Car,
  DollarSign,
  ShieldCheck,
  Zap,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Navigation,
} from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Nominatim reverse geocode helper
const fetchAddress = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    return data.display_name || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
  } catch {
    return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
  }
};

function LocationPicker({ setCoordinates, setAddress }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setCoordinates([lat, lng]);
      const addr = await fetchAddress(lat, lng);
      setAddress(addr);
      toast.success("Location pinned from map");
    },
  });
  return null;
}

function FlyToHelper({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target && map) map.flyTo(target, 15, { duration: 1.0 });
  }, [target, map]);
  return null;
}

const AMENITIES_OPTIONS = [
  { key: "covered", label: "Covered Parking", icon: ShieldCheck },
  { key: "ev_charging", label: "EV Charging", icon: Zap },
  { key: "cctv", label: "24/7 CCTV", icon: ShieldCheck },
  { key: "disabled_access", label: "Accessible Bay", icon: CheckCircle2 },
  { key: "valet", label: "Valet Attendant", icon: Car },
  { key: "gated", label: "Gated Barrier", icon: ShieldCheck },
  { key: "lit_lot", label: "Well-Lit Lot", icon: Sparkles },
];

export default function AddSpotPage() {
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    spotType: "p2p",
    address: "",
    description: "",
    pricePerHour: "",
    vehicleSize: "any",
    amenities: [],
    accessInstructions: "",
  });

  const [coordinates, setCoordinates] = useState(null);
  const [mapCenter, setMapCenter] = useState([28.6139, 77.209]); // Default: Delhi
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);

  // Auto detect initial user location if available
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setMapCenter(coords);
        },
        () => {}
      );
    }
  }, []);

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    toast.loading("Locating GPS coordinates...", { id: "geo" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const coords = [lat, lng];
        setMapCenter(coords);
        setCoordinates(coords);

        try {
          const addr = await fetchAddress(lat, lng);
          setFormData((prev) => ({ ...prev, address: addr }));
        } catch {
          toast.error("Unable to resolve address text");
        }

        if (mapRef.current) {
          mapRef.current.flyTo(coords, 16, { duration: 1.0 });
        }
        toast.success("Location updated to GPS position", { id: "geo" });
      },
      () => {
        toast.dismiss("geo");
        toast.error("Unable to access current GPS location");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleAmenity = (key) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(key)
        ? prev.amenities.filter((a) => a !== key)
        : [...prev.amenities, key],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { spotType, address, pricePerHour } = formData;

    if (!spotType || !address || !coordinates || !pricePerHour) {
      toast.error("Please fill in required fields and select a map location");
      return;
    }

    const [latitude, longitude] = coordinates;

    try {
      setLoading(true);
      const config = { withCredentials: true, headers: {} };
      if (userInfo?.token) {
        config.headers.Authorization = `Bearer ${userInfo.token}`;
      }

      await axios.post(
        "/api/spots/available",
        { ...formData, latitude, longitude },
        config
      );

      toast.success("Parking space published successfully!");
      navigate("/host/dashboard");
    } catch (err) {
      console.error("Error creating spot:", err);
      toast.error(err.response?.data?.message || "Failed to publish parking space");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20 space-y-6">
      <PageHeader
        title="List a New Parking Space"
        description="Provide space specifications, set your hourly rate, and pinpoint the exact entrance on the map."
        breadcrumbs={[
          { label: "Host Dashboard", href: "/host/dashboard" },
          { label: "Add Parking Space" },
        ]}
      />

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: STRUCTURED FORM SECTIONS (7 COLS) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Basic Information */}
          <Card padding="default">
            <h2 className="text-sm font-bold text-[#0F172A] mb-3 pb-2 border-b border-[#F1F5F9]">
              1. Basic Space Information
            </h2>
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#1E293B] font-semibold mb-1">
                  Space Title (e.g., Secure Gated Driveway near Metro)
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Covered Driveway near Connaught Place"
                  className="w-full border border-[#DDE3EA] rounded-lg px-3 py-2 text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1E293B] font-semibold mb-1">
                    Space Classification
                  </label>
                  <select
                    name="spotType"
                    value={formData.spotType}
                    onChange={handleChange}
                    className="w-full border border-[#DDE3EA] rounded-lg px-2.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="p2p">Peer-to-Peer (Driveway/Residential)</option>
                    <option value="operator">Commercial Hub / Structured Lot</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#1E293B] font-semibold mb-1">
                    Max Vehicle Compatibility
                  </label>
                  <select
                    name="vehicleSize"
                    value={formData.vehicleSize}
                    onChange={handleChange}
                    className="w-full border border-[#DDE3EA] rounded-lg px-2.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="any">Any Vehicle Size</option>
                    <option value="compact">Compact / Hatchback</option>
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV / Truck</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#1E293B] font-semibold mb-1">
                  Full Street Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address or select from the map"
                  className="w-full border border-[#DDE3EA] rounded-lg px-3 py-2 text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB]"
                  required
                />
                <p className="text-[11px] text-[#475569] mt-1">
                  Pinpoint your entrance on the map to auto-fill exact address.
                </p>
              </div>

              <div>
                <label className="block text-[#1E293B] font-semibold mb-1">
                  Space Description
                </label>
                <textarea
                  rows={2}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe clearance, ease of access, lighting, or specific bay numbers..."
                  className="w-full border border-[#DDE3EA] rounded-lg p-2.5 text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>
          </Card>

          {/* Section 2: Pricing & Instructions */}
          <Card padding="default">
            <h2 className="text-sm font-bold text-[#0F172A] mb-3 pb-2 border-b border-[#F1F5F9]">
              2. Hourly Pricing & Access Rules
            </h2>
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#1E293B] font-semibold mb-1">
                  Base Hourly Rate ($ USD)
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569] font-semibold">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    name="pricePerHour"
                    value={formData.pricePerHour}
                    onChange={handleChange}
                    placeholder="10.00"
                    className="w-full pl-7 pr-3 py-2 border border-[#DDE3EA] rounded-lg text-xs font-semibold text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB]"
                    required
                  />
                </div>
                <p className="text-[11px] text-[#475569] mt-1">
                  Tip: Most urban residential spaces charge between $5 to $20/hr.
                </p>
              </div>

              <div>
                <label className="block text-[#1E293B] font-semibold mb-1">
                  Driver Entry & Gate Instructions
                </label>
                <textarea
                  rows={2}
                  name="accessInstructions"
                  value={formData.accessInstructions}
                  onChange={handleChange}
                  placeholder="e.g. Ring doorbell #4, enter gate code 1234, or park in bay labeled P-2."
                  className="w-full border border-[#DDE3EA] rounded-lg p-2.5 text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>
          </Card>

          {/* Section 3: Amenities */}
          <Card padding="default">
            <h2 className="text-sm font-bold text-[#0F172A] mb-3 pb-2 border-b border-[#F1F5F9]">
              3. Available Amenities & Security
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AMENITIES_OPTIONS.map((item) => {
                const isSelected = formData.amenities.includes(item.key);
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleAmenity(item.key)}
                    className={`p-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition cursor-pointer text-left ${
                      isSelected
                        ? "bg-blue-50 border-blue-200 text-[#2563EB]"
                        : "bg-white border-[#DDE3EA] text-[#334155] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <Icon size={14} className={isSelected ? "text-[#2563EB]" : "text-[#64748B]"} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Submission Row */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              size="md"
              href="/host/dashboard"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
            >
              {loading ? "Publishing..." : "Publish Parking Space"}
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE LEAFLET PINPICKER (5 COLS) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
          <Card padding="default">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-[#0F172A]">
                  Pinpoint Location on Map
                </h3>
                <p className="text-[11px] text-[#334155]">
                  Click the map to place the marker.
                </p>
              </div>
              <button
                type="button"
                onClick={handleMyLocation}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:bg-blue-50 px-2 py-1 rounded transition cursor-pointer"
              >
                <Navigation size={12} /> Near Me
              </button>
            </div>

            <div className="h-72 w-full rounded-lg overflow-hidden border border-[#DDE3EA] relative">
              <MapContainer
                center={mapCenter}
                zoom={14}
                style={{ height: "100%", width: "100%" }}
                whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
              >
                <TileLayer
                  attribution='&copy; <a href="https://openstreetmap.org">OSM</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker
                  setCoordinates={setCoordinates}
                  setAddress={(addr) =>
                    setFormData((prev) => ({ ...prev, address: addr }))
                  }
                />
                <FlyToHelper target={mapCenter} />

                {coordinates && (
                  <Marker
                    position={coordinates}
                    draggable={true}
                    eventHandlers={{
                      dragend: async (e) => {
                        const { lat, lng } = e.target.getLatLng();
                        setCoordinates([lat, lng]);
                        const addr = await fetchAddress(lat, lng);
                        setFormData((prev) => ({ ...prev, address: addr }));
                        toast("Marker position updated");
                      },
                    }}
                  />
                )}
              </MapContainer>
            </div>

            {coordinates ? (
              <div className="mt-3 p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1">
                <span className="text-[11px] font-semibold text-[#16845B] flex items-center gap-1">
                  <CheckCircle2 size={12} /> Location Pinned
                </span>
                <p className="text-[#475569] text-[11px] truncate font-mono">
                  {coordinates[0].toFixed(5)}, {coordinates[1].toFixed(5)}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-[11px] text-[#DC4545] font-medium">
                * Click on the map or use "Near Me" to pinpoint your space coordinates.
              </p>
            )}
          </Card>
        </div>
      </form>
    </div>
  );
}
