import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
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

function DraggableMarker({ position, setPosition, onAddressUpdate }) {
  const markerRef = useRef(null);

  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      const address = await fetchAddress(lat, lng);
      onAddressUpdate(address, lat, lng);
    },
  });

  return (
    <Marker
      draggable={true}
      position={position}
      ref={markerRef}
      eventHandlers={{
        dragend: async () => {
          const marker = markerRef.current;
          if (marker) {
            const lat = marker.getLatLng().lat;
            const lng = marker.getLatLng().lng;
            setPosition([lat, lng]);
            const address = await fetchAddress(lat, lng);
            onAddressUpdate(address, lat, lng);
          }
        },
      }}
    />
  );
}

function FlyToHelper({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target && map) map.flyTo(target, 16, { duration: 1.0 });
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

export default function EditSpotPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    address: "",
    description: "",
    pricePerHour: "",
    spotType: "p2p",
    vehicleSize: "any",
    amenities: [],
    accessInstructions: "",
  });

  const [position, setPosition] = useState([28.6139, 77.209]);
  const [mapCenter, setMapCenter] = useState([28.6139, 77.209]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchSpot = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/spots/${id}`);
        setFormData({
          title: data.title || "",
          address: data.address || "",
          description: data.description || "",
          pricePerHour: data.pricePerHour || "",
          spotType: data.spotType || "p2p",
          vehicleSize: data.vehicleSize || "any",
          amenities: Array.isArray(data.amenities) ? data.amenities : [],
          accessInstructions: data.accessInstructions || "",
        });
        if (data.location?.coordinates) {
          const coords = [data.location.coordinates[1], data.location.coordinates[0]];
          setPosition(coords);
          setMapCenter(coords);
        }
      } catch (err) {
        console.error(err);
        toast.error("Unable to fetch spot details");
      } finally {
        setLoading(false);
      }
    };
    fetchSpot();
  }, [id]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleAmenity = (key) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(key)
        ? prev.amenities.filter((a) => a !== key)
        : [...prev.amenities, key],
    }));
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation is not supported");

    toast.loading("Locating GPS coordinates...", { id: "geo" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const coords = [lat, lng];
        setPosition(coords);
        setMapCenter(coords);

        try {
          const addr = await fetchAddress(lat, lng);
          setFormData((prev) => ({ ...prev, address: addr }));
        } catch {
          toast.error("Unable to resolve address");
        }

        if (mapRef.current) {
          mapRef.current.flyTo(coords, 16, { duration: 1.0 });
        }
        toast.success("Location updated to GPS position", { id: "geo" });
      },
      () => {
        toast.dismiss("geo");
        toast.error("Unable to access GPS location");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const [latitude, longitude] = position;
      await axios.put(
        `/api/spots/${id}`,
        { ...formData, latitude, longitude },
        { withCredentials: true }
      );
      toast.success("Parking space updated successfully!");
      navigate("/host/dashboard");
    } catch (err) {
      console.error("Update spot error:", err);
      toast.error(err.response?.data?.message || "Failed to update spot");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-2">
        <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#334155]">Loading spot listing for editing...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20 space-y-6">
      <PageHeader
        title="Edit Parking Space"
        description="Update your listing's address, rate, vehicle specifications, or entrance map coordinates."
        breadcrumbs={[
          { label: "Host Dashboard", href: "/host/dashboard" },
          { label: "Edit Space" },
        ]}
      />

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: FORM SECTIONS (7 COLS) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Basic Information */}
          <Card padding="default">
            <h2 className="text-sm font-bold text-[#0F172A] mb-3 pb-2 border-b border-[#F1F5F9]">
              1. Basic Space Information
            </h2>
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#1E293B] font-semibold mb-1">
                  Space Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
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
                    Vehicle Compatibility
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
                  Street Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full border border-[#DDE3EA] rounded-lg px-3 py-2 text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#1E293B] font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
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
                    className="w-full pl-7 pr-3 py-2 border border-[#DDE3EA] rounded-lg text-xs font-semibold text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#2563EB]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#1E293B] font-semibold mb-1">
                  Driver Access Instructions
                </label>
                <textarea
                  rows={2}
                  name="accessInstructions"
                  value={formData.accessInstructions}
                  onChange={handleChange}
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

          {/* Submit Row */}
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
              disabled={saving}
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: MAP LOCATION (5 COLS) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
          <Card padding="default">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-[#0F172A]">
                  Adjust Location Marker
                </h3>
                <p className="text-[11px] text-[#334155]">
                  Drag the marker or click on the map.
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
                zoom={15}
                style={{ height: "100%", width: "100%" }}
                whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
              >
                <TileLayer
                  attribution='&copy; <a href="https://openstreetmap.org">OSM</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <DraggableMarker
                  position={position}
                  setPosition={setPosition}
                  onAddressUpdate={(addr) =>
                    setFormData((prev) => ({ ...prev, address: addr }))
                  }
                />
                <FlyToHelper target={mapCenter} />
              </MapContainer>
            </div>

            <div className="mt-3 p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1">
              <span className="text-[11px] font-semibold text-[#16845B] flex items-center gap-1">
                <CheckCircle2 size={12} /> Coordinates Selected
              </span>
              <p className="text-[#475569] text-[11px] truncate font-mono">
                {position[0].toFixed(5)}, {position[1].toFixed(5)}
              </p>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
