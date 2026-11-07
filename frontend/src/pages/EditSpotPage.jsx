import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Reverse geocode helper using OpenStreetMap
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

// Marker logic: drag or click to move
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
    if (target && map) map.flyTo(target, 16, { duration: 1.2 });
  }, [target, map]);
  return null;
}

const EditSpotPage = () => {
  const { id } = useParams();
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
  const [position, setPosition] = useState([28.6139, 77.209]); // Default Delhi
  const [mapCenter, setMapCenter] = useState([28.6139, 77.209]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const navigate = useNavigate();

  // Load existing spot
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

  // My Location Button
  const handleMyLocation = async () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");

    toast.loading("Fetching your current location...", { id: "geo" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const coords = [lat, lng];
        setPosition(coords);
        setMapCenter(coords);
        const address = await fetchAddress(lat, lng);
        setFormData((prev) => ({ ...prev, address }));
        toast.success("Location updated successfully!", { id: "geo" });
      },
      () => toast.error("Failed to get location", { id: "geo" }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Update address + coordinates after drag/click
  const handleAddressUpdate = (address, lat, lng) => {
    setFormData((prev) => ({ ...prev, address }));
    if (lat !== undefined && lng !== undefined) {
      setPosition([lat, lng]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.address || !formData.pricePerHour) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await axios.put(`/api/spots/${id}`, {
        ...formData,
        latitude: position[0],
        longitude: position[1],
      });
      toast.success("Spot updated successfully");
      navigate("/host/dashboard");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update spot");
    }
  };

  if (loading)
    return (
      <div className="text-center text-gray-600 mt-20 text-lg">
        Loading spot details...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <section className="bg-gradient-to-r from-blue-600 to-blue-400 text-white py-10 text-center shadow">
        <h1 className="text-3xl font-bold mb-2">Edit Parking Spot</h1>
        <p className="text-blue-100 text-sm">
          Update spot details, pricing, and location
        </p>
      </section>

      <div className="max-w-5xl mx-auto mt-10 px-6 grid lg:grid-cols-2 gap-8">
        {/* Map Section */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 relative">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">
              Adjust Spot Location
            </h2>
            <p className="text-xs text-gray-500">
              Click or drag the marker to reposition your spot.
            </p>
          </div>

          {/* My Location Button */}
          <button
            onClick={handleMyLocation}
            className="absolute top-25 left-15 z-[1000] bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded-md shadow-md transition"
          >
            📍 My Location
          </button>

          <div className="h-[65vh]">
            <MapContainer
              center={mapCenter}
              zoom={15}
              scrollWheelZoom
              style={{ height: "100%", width: "100%" }}
              whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
            >
              <TileLayer
                attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FlyToHelper target={mapCenter} />
              <DraggableMarker
                position={position}
                setPosition={setPosition}
                onAddressUpdate={handleAddressUpdate}
              />
            </MapContainer>
          </div>

          <div className="p-4 border-t text-sm text-gray-600 bg-gray-50">
            <p>
              Latitude:{" "}
              <span className="font-medium">{position[0].toFixed(5)}</span> | Longitude:{" "}
              <span className="font-medium">{position[1].toFixed(5)}</span>
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Spot Title / Name
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                placeholder="e.g. Connaught Place Premium Garage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter address"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Describe your spot"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Spot Type
              </label>
              <select
                name="spotType"
                value={formData.spotType}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="p2p">P2P (Host-Owned Spot)</option>
                <option value="operator">Operator (Commercial Lot)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Price Per Hour ($)
              </label>
              <input
                type="number"
                name="pricePerHour"
                value={formData.pricePerHour}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter price per hour"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Compatibility
              </label>
              <select
                name="vehicleSize"
                value={formData.vehicleSize}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="any">Any Vehicle</option>
                <option value="compact">Compact / Hatchback</option>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV / Truck</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Amenities & Features
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: "covered", label: "Covered Parking" },
                  { key: "ev_charging", label: "EV Supercharging" },
                  { key: "cctv", label: "24/7 CCTV / Security" },
                  { key: "disabled_access", label: "Accessible / Disabled Bay" },
                  { key: "valet", label: "Valet Service" },
                  { key: "gated", label: "Gated Access Barrier" },
                ].map((item) => {
                  const isChecked = formData.amenities?.includes(item.key);
                  return (
                    <label
                      key={item.key}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                        isChecked
                          ? "bg-blue-50 border-blue-300 text-blue-700 font-medium"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            amenities: isChecked
                              ? prev.amenities.filter((k) => k !== item.key)
                              : [...prev.amenities, item.key],
                          }));
                        }}
                        className="accent-blue-600"
                      />
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Access & Entry Instructions
              </label>
              <input
                type="text"
                name="accessInstructions"
                value={formData.accessInstructions}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                placeholder="e.g. Ring intercom 3B or enter code #1234"
              />
            </div>

            <div className="flex justify-between gap-3 mt-8">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-1/2 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditSpotPage;
