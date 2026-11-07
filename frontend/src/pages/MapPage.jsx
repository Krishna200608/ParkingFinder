import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import toast from "react-hot-toast";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useAuth } from "../context/AuthContext";
import BookingModal from "../components/booking/BookingModal";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import {
  MapPin,
  Search,
  SlidersHorizontal,
  Heart,
  Star,
  Zap,
  ShieldCheck,
  ArrowUpRight,
  Car,
  RotateCcw,
  Layers,
  Flame,
  List,
  Map as MapIcon,
  RefreshCw,
  X,
} from "lucide-react";

// Fix Leaflet default marker icons in Vite
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function FlyToHelper({ target, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (target && map) {
      map.flyTo(target, zoom, { duration: 1.0 });
    }
  }, [target, map, zoom]);
  return null;
}

function MapResizeListener() {
  const map = useMap();
  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener("resize", handleResize);
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [map]);
  return null;
}

export default function MapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userInfo } = useAuth();

  const [spots, setSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingSpot, setBookingSpot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [position, setPosition] = useState([28.6139, 77.209]); // Default: Delhi Connaught Place
  const [radiusKm, setRadiusKm] = useState(15);
  const [zoom, setZoom] = useState(13);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [locationSearch, setLocationSearch] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [maxPrice, setMaxPrice] = useState(50);
  const [spotType, setSpotType] = useState("all");
  const [vehicleSize, setVehicleSize] = useState("any");
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [sortBy, setSortBy] = useState("distance");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [savedFavorites, setSavedFavorites] = useState([]);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapPoints, setHeatmapPoints] = useState([]);

  // Mobile View Toggle: 'split' | 'list' | 'map'
  const [mobileView, setMobileView] = useState("list");

  const mapRef = useRef();
  const markerRefs = useRef({});
  const cardRefs = useRef({});
  const searchTimeoutRef = useRef(null);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("parkingfinder_saved_spots") || "[]"
      );
      setSavedFavorites(saved);
    } catch {
      setSavedFavorites([]);
    }
  }, []);

  const toggleFavorite = (spotId) => {
    try {
      let updated;
      if (savedFavorites.includes(spotId)) {
        updated = savedFavorites.filter((id) => id !== spotId);
        toast("Removed from favorites");
      } else {
        updated = [...savedFavorites, spotId];
        toast.success("Saved to favorites!");
      }
      setSavedFavorites(updated);
      localStorage.setItem("parkingfinder_saved_spots", JSON.stringify(updated));
    } catch (e) {
      console.error("Error updating favorites:", e);
    }
  };

  // Toggle heatmap overlay
  const toggleHeatmap = async () => {
    const nextState = !showHeatmap;
    setShowHeatmap(nextState);
    if (nextState && heatmapPoints.length === 0) {
      try {
        const { data } = await axios.get("/api/spots/demand-heatmap");
        setHeatmapPoints(Array.isArray(data) ? data : []);
        toast.success("Demand heatmap overlay enabled");
      } catch (err) {
        console.error("Heatmap fetch error:", err);
      }
    }
  };

  // Fetch spots with filters
  const fetchSpots = useCallback(async () => {
    try {
      if (!position) return;
      setIsLoading(true);
      const radiusMeters = radiusKm * 1000;

      const params = {
        lat: position[0],
        lng: position[1],
        radius: radiusMeters,
        maxPrice: maxPrice < 50 ? maxPrice : undefined,
        spotType: spotType !== "all" ? spotType : undefined,
        vehicleSize: vehicleSize !== "any" ? vehicleSize : undefined,
        amenities:
          selectedAmenities.length > 0
            ? selectedAmenities.join(",")
            : undefined,
        search: searchQuery.trim() || undefined,
        sort: sortBy,
      };

      const { data } = await axios.get("/api/spots", {
        params,
        withCredentials: true,
      });

      let filtered = Array.isArray(data) ? data : [];
      if (showFavoritesOnly) {
        filtered = filtered.filter((s) => savedFavorites.includes(s._id));
      }

      setSpots(filtered);
    } catch (err) {
      console.error("Failed to fetch spots:", err);
      toast.error("Unable to load spots");
    } finally {
      setIsLoading(false);
    }
  }, [
    position,
    radiusKm,
    maxPrice,
    spotType,
    vehicleSize,
    selectedAmenities,
    searchQuery,
    sortBy,
    showFavoritesOnly,
    savedFavorites,
  ]);

  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  // Adjust zoom dynamically when radius changes
  useEffect(() => {
    const calculatedZoom = Math.max(10, Math.min(16, 16 - Math.log2(radiusKm)));
    setZoom(calculatedZoom);
  }, [radiusKm]);

  // Nominatim geocoding autocomplete
  const handleLocationSearchChange = (e) => {
    const val = e.target.value;
    setLocationSearch(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.trim().length < 2) {
      setLocationResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            val
          )}&limit=5`,
          {
            headers: { "Accept-Language": "en" },
          }
        );
        const data = await res.json();
        setLocationResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Geocoding failed:", err);
      }
    }, 400);
  };

  const selectLocationResult = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    if (!isNaN(lat) && !isNaN(lon)) {
      const target = [lat, lon];
      setPosition(target);
      setLocationSearch(item.display_name.split(",")[0]);
      setLocationResults([]);
      if (mapRef.current) {
        mapRef.current.flyTo(target, 14, { duration: 1.0 });
      }
      toast.success(`Centered on ${item.display_name.split(",")[0]}`);
    }
  };

  // GPS My Location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setPosition(coords);
        setLocationSearch("Current Location");
        setLocationResults([]);
        if (mapRef.current) {
          mapRef.current.flyTo(coords, 14, { duration: 1.0 });
        }
        toast.success("Centered on your current location");
      },
      (err) => {
        console.warn("Location error:", err);
        toast.error("Could not obtain location. Check browser permissions.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Seed demo spots
  const handleSeedDemoSpots = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.post(
        "/api/spots/seed?force=true",
        {},
        { withCredentials: true }
      );
      toast.success(data.message || "Demo spots populated successfully!");
      await fetchSpots();
    } catch (err) {
      console.error("Failed to seed spots:", err);
      toast.error(err.response?.data?.message || "Unable to seed demo spots");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (spot) => {
    const currentUserId = userInfo?._id || userInfo?.user?._id;
    if (currentUserId && spot.owner?._id === currentUserId) {
      toast.error("Hosts manage their own spaces from the Host Dashboard.");
      navigate(`/host/edit-spot/${spot._id}`);
      return;
    }
    setBookingSpot(spot);
    setIsModalOpen(true);
  };

  const handleCloseModal = (success) => {
    setIsModalOpen(false);
    setBookingSpot(null);
    if (success) fetchSpots();
  };

  const focusSpotOnMap = (spot) => {
    setSelectedSpot(spot);
    const lat = spot.location.coordinates[1];
    const lng = spot.location.coordinates[0];
    const target = [lat, lng];

    if (mapRef.current) {
      mapRef.current.flyTo(target, 16, { duration: 0.8 });
    }

    setTimeout(() => {
      const ref = markerRefs.current[spot._id];
      if (ref) ref.openPopup();
    }, 850);
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const resetFilters = () => {
    setSearchQuery("");
    setMaxPrice(50);
    setSpotType("all");
    setVehicleSize("any");
    setSelectedAmenities([]);
    setSortBy("distance");
    setShowFavoritesOnly(false);
    setRadiusKm(15);
  };

  const activeFilterCount =
    (maxPrice < 50 ? 1 : 0) +
    (spotType !== "all" ? 1 : 0) +
    (vehicleSize !== "any" ? 1 : 0) +
    selectedAmenities.length +
    (showFavoritesOnly ? 1 : 0);

  return (
    <div className="h-full flex flex-col bg-[#F4F6F8] overflow-hidden">
      {/* ── 1. COMPACT TOOLBAR ─────────────────────────────────── */}
      <div className="bg-white border-b border-[#DDE3EA] px-4 py-2.5 shrink-0 z-30">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Location & Keyword Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[280px] max-w-xl relative">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none"
              />
              <input
                type="text"
                value={locationSearch}
                onChange={handleLocationSearchChange}
                placeholder="Search area, landmark or metro hub..."
                className="w-full pl-9 pr-20 py-1.5 text-xs rounded-lg border border-[#DDE3EA] bg-white text-[#17243A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={getUserLocation}
                className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[11px] font-medium text-[#2563EB] hover:bg-blue-50 rounded transition flex items-center gap-1 cursor-pointer"
                title="Use current GPS location"
              >
                <MapPin size={12} /> Near Me
              </button>

              {/* Nominatim Autocomplete Menu */}
              {locationResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-lg shadow-lg border border-[#DDE3EA] z-50 overflow-hidden divide-y divide-[#F1F5F9]">
                  {locationResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectLocationResult(item)}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-blue-50/50 transition flex items-center gap-2 cursor-pointer"
                    >
                      <MapPin size={13} className="text-[#2563EB] shrink-0" />
                      <span className="truncate text-[#17243A]">
                        {item.display_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Keyword Search Input */}
            <div className="relative hidden md:block w-48">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by title..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#DDE3EA] bg-white text-[#17243A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#17243A] cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills & Actions */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                showFilterDrawer || activeFilterCount > 0
                  ? "bg-blue-50 border-blue-200 text-[#2563EB]"
                  : "bg-white border-[#DDE3EA] text-[#475569] hover:bg-[#F8FAFC]"
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#2563EB] text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                showFavoritesOnly
                  ? "bg-rose-50 border-rose-200 text-rose-600"
                  : "bg-white border-[#DDE3EA] text-[#475569] hover:bg-[#F8FAFC]"
              }`}
            >
              <Heart
                size={13}
                className={showFavoritesOnly ? "fill-rose-500 text-rose-500" : ""}
              />
              <span className="hidden sm:inline">Favorites</span> ({savedFavorites.length})
            </button>

            <button
              type="button"
              onClick={() => toggleAmenity("ev_charging")}
              className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                selectedAmenities.includes("ev_charging")
                  ? "bg-emerald-50 border-emerald-200 text-[#16845B]"
                  : "bg-white border-[#DDE3EA] text-[#475569] hover:bg-[#F8FAFC]"
              }`}
            >
              <Zap size={13} /> EV
            </button>

            <button
              type="button"
              onClick={() => toggleAmenity("covered")}
              className={`hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                selectedAmenities.includes("covered")
                  ? "bg-blue-50 border-blue-200 text-[#2563EB]"
                  : "bg-white border-[#DDE3EA] text-[#475569] hover:bg-[#F8FAFC]"
              }`}
            >
              <ShieldCheck size={13} /> Covered
            </button>

            <button
              type="button"
              onClick={toggleHeatmap}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                showHeatmap
                  ? "bg-amber-50 border-amber-200 text-[#D97706]"
                  : "bg-white border-[#DDE3EA] text-[#475569] hover:bg-[#F8FAFC]"
              }`}
              title="Demand Heatmap overlay"
            >
              <Flame size={13} className={showHeatmap ? "text-[#D97706]" : "text-[#94A3B8]"} />
              <span className="hidden sm:inline">Heatmap</span>
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-[#DDE3EA] rounded-lg px-2 py-1.5 bg-white text-xs text-[#475569] focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="distance">Nearest Distance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Rated</option>
            </select>

            {/* Mobile View Switcher (Visible on < lg) */}
            <div className="lg:hidden flex items-center p-0.5 bg-[#F1F5F9] rounded-lg border border-[#E2E8F0] ml-1">
              <button
                type="button"
                onClick={() => setMobileView("list")}
                className={`p-1 rounded text-xs transition cursor-pointer ${
                  mobileView === "list"
                    ? "bg-white text-[#2563EB] shadow-2xs"
                    : "text-[#64748B]"
                }`}
                title="List View"
              >
                <List size={14} />
              </button>
              <button
                type="button"
                onClick={() => setMobileView("map")}
                className={`p-1 rounded text-xs transition cursor-pointer ${
                  mobileView === "map"
                    ? "bg-white text-[#2563EB] shadow-2xs"
                    : "text-[#64748B]"
                }`}
                title="Map View"
              >
                <MapIcon size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ── EXPANDABLE FILTER DRAWER ────────────────────────── */}
        {showFilterDrawer && (
          <div className="mt-2.5 pt-2.5 border-t border-[#DDE3EA] grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {/* Radius */}
            <div>
              <div className="flex justify-between font-medium text-[#17243A] mb-1">
                <span>Search Radius</span>
                <span className="text-[#2563EB] font-semibold">{radiusKm} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full accent-[#2563EB] cursor-pointer"
              />
            </div>

            {/* Price */}
            <div>
              <div className="flex justify-between font-medium text-[#17243A] mb-1">
                <span>Maximum Rate</span>
                <span className="text-[#2563EB] font-semibold">
                  {maxPrice >= 50 ? "Any ($50+)" : `$${maxPrice}/hr`}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#2563EB] cursor-pointer"
              />
            </div>

            {/* Vehicle Size */}
            <div>
              <span className="font-medium text-[#17243A] block mb-1">
                Vehicle Compatibility
              </span>
              <select
                value={vehicleSize}
                onChange={(e) => setVehicleSize(e.target.value)}
                className="w-full border border-[#DDE3EA] rounded-md px-2 py-1 bg-white text-xs text-[#475569]"
              >
                <option value="any">Any Size</option>
                <option value="compact">Compact / Hatchback</option>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV / Van</option>
              </select>
            </div>

            {/* Spot Type & Reset */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-[#17243A]">Listing Type</span>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-[#DC4545] hover:underline flex items-center gap-0.5 text-[11px] cursor-pointer"
                  >
                    <RotateCcw size={10} /> Reset all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { key: "all", label: "All" },
                  { key: "operator", label: "Hub" },
                  { key: "p2p", label: "P2P" },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setSpotType(t.key)}
                    className={`py-1 rounded text-center transition cursor-pointer ${
                      spotType === t.key
                        ? "bg-[#2563EB] text-white font-medium"
                        : "bg-[#F4F6F8] border border-[#DDE3EA] text-[#475569] hover:bg-[#E2E8F0]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. FULL VIEWPORT SPLIT VIEW ────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT: LISTINGS PANEL */}
        <div
          className={`w-full lg:w-[440px] xl:w-[480px] bg-white border-r border-[#DDE3EA] flex flex-col shrink-0 z-20 ${
            mobileView === "map" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* List Header */}
          <div className="px-4 py-3 border-b border-[#DDE3EA] flex items-center justify-between bg-[#F8FAFC]">
            <div>
              <span className="text-xs font-semibold text-[#17243A]">
                {spots.length} spaces available
              </span>
              <span className="text-[11px] text-[#64748B] ml-1.5">
                within {radiusKm} km
              </span>
            </div>
            <button
              type="button"
              onClick={fetchSpots}
              className="p-1 text-[#64748B] hover:text-[#2563EB] transition rounded hover:bg-white cursor-pointer"
              title="Refresh spots"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Cards Scroll Container */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {isLoading && spots.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#64748B]">
                <div className="w-5 h-5 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Scanning active parking bays...
              </div>
            ) : spots.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="No parking spaces found"
                description={`No active spaces found within ${radiusKm} km matching your current filters.`}
                className="my-4"
              >
                <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRadiusKm(30)}
                  >
                    Expand radius to 30 km
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSeedDemoSpots}
                  >
                    Populate Realistic Demo Spots
                  </Button>
                </div>
              </EmptyState>
            ) : (
              spots.map((spot) => {
                const isSelected = selectedSpot?._id === spot._id;
                const isFav = savedFavorites.includes(spot._id);
                const isOwner =
                  spot.owner?._id === (userInfo?._id || userInfo?.user?._id);

                return (
                  <Card
                    key={spot._id}
                    ref={(el) => (cardRefs.current[spot._id] = el)}
                    onClick={() => focusSpotOnMap(spot)}
                    padding="sm"
                    className={`transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#2563EB] ring-2 ring-blue-100 bg-blue-50/20"
                        : "hover:border-[#CBD5E1]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              spot.spotType === "operator"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-emerald-50 text-[#16845B] border border-emerald-200"
                            }`}
                          >
                            {spot.spotType === "operator" ? "Hub" : "P2P"}
                          </span>
                          {isOwner && (
                            <Badge variant="brand" size="sm">
                              Your Space
                            </Badge>
                          )}
                          {spot.distanceKm !== null &&
                            spot.distanceKm !== undefined && (
                              <span className="text-[11px] text-[#64748B]">
                                • {spot.distanceKm} km away
                              </span>
                            )}
                        </div>

                        <h4 className="font-semibold text-xs sm:text-sm text-[#17243A] truncate">
                          {spot.title || spot.address}
                        </h4>
                        <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                          {spot.address}
                        </p>
                      </div>

                      {/* Price & Favorite */}
                      <div className="text-right shrink-0">
                        <div className="text-sm sm:text-base font-bold text-[#17243A]">
                          ${spot.pricePerHour}
                          <span className="text-[10px] text-[#64748B] font-normal">
                            /hr
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(spot._id);
                          }}
                          className="mt-1 p-0.5 text-[#94A3B8] hover:text-rose-500 transition cursor-pointer"
                          title={isFav ? "Saved" : "Save spot"}
                        >
                          <Heart
                            size={14}
                            className={
                              isFav ? "fill-rose-500 text-rose-500" : ""
                            }
                          />
                        </button>
                      </div>
                    </div>

                    {/* Amenity Badges */}
                    <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px]">
                      {spot.rating > 0 && (
                        <span className="inline-flex items-center gap-0.5 font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <Star size={9} className="fill-amber-400" />{" "}
                          {spot.rating.toFixed(1)}
                        </span>
                      )}
                      {spot.vehicleSize && spot.vehicleSize !== "any" && (
                        <span className="inline-flex items-center gap-0.5 text-[#475569] bg-[#F1F5F9] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                          <Car size={9} /> {spot.vehicleSize.toUpperCase()}
                        </span>
                      )}
                      {spot.amenities?.includes("covered") && (
                        <span className="bg-blue-50 text-[#2563EB] px-1.5 py-0.5 rounded border border-blue-200">
                          Covered
                        </span>
                      )}
                      {spot.amenities?.includes("ev_charging") && (
                        <span className="bg-emerald-50 text-[#16845B] px-1.5 py-0.5 rounded border border-emerald-200">
                          EV
                        </span>
                      )}
                      {spot.amenities?.includes("cctv") && (
                        <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                          CCTV
                        </span>
                      )}
                    </div>

                    {/* Action Row */}
                    <div className="mt-2.5 pt-2 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                      <Link
                        to={`/spots/${spot._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] font-semibold text-[#2563EB] hover:underline flex items-center gap-0.5"
                      >
                        Details <ArrowUpRight size={11} />
                      </Link>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            focusSpotOnMap(spot);
                            setMobileView("map");
                          }}
                          className="px-2 py-1 text-[11px] rounded border border-[#DDE3EA] text-[#475569] hover:bg-[#F8FAFC] transition cursor-pointer"
                        >
                          Locate
                        </button>
                        {isOwner ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-[11px] py-0.5 px-2.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/host/edit-spot/${spot._id}`);
                            }}
                          >
                            Manage
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-[11px] py-0.5 px-2.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenModal(spot);
                            }}
                          >
                            Reserve
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: LEAFLET MAP */}
        <div
          className={`flex-1 h-full w-full relative ${
            mobileView === "list" ? "hidden lg:block" : "block"
          }`}
        >
          <MapContainer
            center={position}
            zoom={zoom}
            style={{ height: "100%", width: "100%" }}
            whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
          >
            <TileLayer
              attribution='&copy; <a href="https://openstreetmap.org">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FlyToHelper target={position} zoom={zoom} />
            <MapResizeListener />

            {/* Radius Boundary */}
            <Circle
              center={position}
              radius={radiusKm * 1000}
              pathOptions={{
                color: "#2563EB",
                fillColor: "#2563EB",
                fillOpacity: 0.08,
                weight: 1.5,
              }}
            />

            {/* Demand Heatmap Layer */}
            {showHeatmap &&
              heatmapPoints.map((hp) => (
                <Circle
                  key={`heat-${hp._id}`}
                  center={[hp.lat, hp.lng]}
                  radius={850}
                  pathOptions={{
                    color:
                      hp.intensity >= 0.75
                        ? "#DC4545"
                        : hp.intensity >= 0.5
                        ? "#D97706"
                        : "#2563EB",
                    fillColor:
                      hp.intensity >= 0.75
                        ? "#DC4545"
                        : hp.intensity >= 0.5
                        ? "#D97706"
                        : "#2563EB",
                    fillOpacity: 0.3,
                    weight: 1,
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-[#17243A] flex items-center gap-1">
                        <Flame size={12} className="text-[#DC4545]" />
                        Demand: {Math.round(hp.intensity * 100)}%
                      </p>
                      <p className="text-[#64748B] line-clamp-1">{hp.title}</p>
                      <p className="font-semibold text-[#2563EB]">
                        Base: ${hp.pricePerHour}/hr
                      </p>
                    </div>
                  </Popup>
                </Circle>
              ))}

            {/* Spot Markers */}
            {spots.map((spot) => {
              const lat = spot.location.coordinates[1];
              const lng = spot.location.coordinates[0];
              const isOwner =
                spot.owner?._id === (userInfo?._id || userInfo?.user?._id);

              return (
                <Marker
                  key={spot._id}
                  ref={(ref) => (markerRefs.current[spot._id] = ref)}
                  position={[lat, lng]}
                  eventHandlers={{
                    click: () => {
                      setSelectedSpot(spot);
                      cardRefs.current[spot._id]?.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                      });
                    },
                  }}
                >
                  <Popup autoClose={false} autoPan>
                    <div className="p-1 space-y-2 text-xs min-w-[200px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#17243A] text-sm">
                          ${spot.pricePerHour}/hr
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            spot.spotType === "operator"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-emerald-100 text-[#16845B]"
                          }`}
                        >
                          {spot.spotType === "operator" ? "Hub" : "P2P"}
                        </span>
                      </div>
                      <h4 className="font-semibold text-[#17243A] line-clamp-1">
                        {spot.title || spot.address}
                      </h4>
                      <p className="text-[#64748B] line-clamp-2 text-[11px]">
                        {spot.address}
                      </p>
                      <div className="flex items-center justify-between pt-1.5 border-t border-[#DDE3EA]">
                        <Link
                          to={`/spots/${spot._id}`}
                          className="text-[#2563EB] hover:underline font-semibold flex items-center gap-0.5 text-[11px]"
                        >
                          Details <ArrowUpRight size={11} />
                        </Link>
                        {isOwner ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/host/edit-spot/${spot._id}`)}
                            className="bg-[#F1F5F9] border border-[#CBD5E1] text-[#475569] hover:bg-[#E2E8F0] font-semibold px-2 py-0.5 rounded text-[11px] cursor-pointer"
                          >
                            Manage
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenModal(spot)}
                            className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold px-2.5 py-0.5 rounded text-[11px] cursor-pointer"
                          >
                            Book Now
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Booking Modal */}
      {isModalOpen && bookingSpot && (
        <BookingModal spot={bookingSpot} onClose={handleCloseModal} />
      )}
    </div>
  );
}
