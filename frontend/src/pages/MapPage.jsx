import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
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
	Sparkles,
	Flame,
} from "lucide-react";

const DefaultIcon = L.icon({
	iconUrl: markerIcon,
	shadowUrl: markerShadow,
	iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function FlyToHelper({ target, zoom }) {
	const map = useMap();
	useEffect(() => {
		if (target && map) map.flyTo(target, zoom, { duration: 1.2 });
	}, [target, map, zoom]);
	return null;
}

const MapPage = () => {
	const navigate = useNavigate();
	const { userInfo } = useAuth();
	const [spots, setSpots] = useState([]);
	const [selectedSpot, setSelectedSpot] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [bookingSpot, setBookingSpot] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [position, setPosition] = useState([28.6139, 77.209]); // Default to Connaught Place / Delhi
	const [radiusKm, setRadiusKm] = useState(15);
	const [zoom, setZoom] = useState(13);

	// Multi-dimensional filters
	const [searchQuery, setSearchQuery] = useState("");
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

	const mapRef = useRef();
	const markerRefs = useRef({});
	const cardRefs = useRef({});
	const searchTimeoutRef = useRef(null);

	// Toggle demand heatmap overlay
	const toggleHeatmap = async () => {
		const nextState = !showHeatmap;
		setShowHeatmap(nextState);
		if (nextState && heatmapPoints.length === 0) {
			try {
				const { data } = await axios.get("/api/spots/demand-heatmap");
				setHeatmapPoints(Array.isArray(data) ? data : []);
				toast.success("Demands heatmap overlay activated");
			} catch (err) {
				console.error("Heatmap fetch error:", err);
			}
		}
	};

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

	// Toggle favorite spot
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
			localStorage.setItem(
				"parkingfinder_saved_spots",
				JSON.stringify(updated)
			);
		} catch (e) {
			console.error("Error updating favorites:", e);
		}
	};

	// Query spots from backend with all filters
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

	// Auto-trigger fetch on filter change
	useEffect(() => {
		fetchSpots();
	}, [fetchSpots]);

	// Adjust zoom dynamically when radius changes
	useEffect(() => {
		const calculatedZoom = Math.max(10, Math.min(16, 16 - Math.log2(radiusKm)));
		setZoom(calculatedZoom);
		if (mapRef.current) {
			mapRef.current.flyTo(position, calculatedZoom, { duration: 1.0 });
		}
	}, [radiusKm, position]);

	// Nominatim Geocoding Search with Debounce
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
						headers: {
							"Accept-Language": "en",
						},
					}
				);
				const data = await res.json();
				setLocationResults(Array.isArray(data) ? data : []);
			} catch (err) {
				console.error("Nominatim search failed:", err);
			}
		}, 450);
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
				mapRef.current.flyTo(target, 14, { duration: 1.2 });
			}
			toast.success(`Centered to ${item.display_name.split(",")[0]}`);
		}
	};

	// Geolocation "My Location"
	const getUserLocation = async () => {
		if (!navigator.geolocation) {
			toast.error("Geolocation is not supported by your browser");
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const coords = [pos.coords.latitude, pos.coords.longitude];
				setPosition(coords);
				setLocationSearch("My Current Location");
				setLocationResults([]);
				if (mapRef.current) {
					mapRef.current.flyTo(coords, 14, { duration: 1.2 });
				}
				toast.success("Centered to your location");
			},
			(err) => {
				console.warn("Location error:", err);
				toast.error("Could not obtain location. Check browser permissions.");
			},
			{ enableHighAccuracy: true, timeout: 8000 }
		);
	};

	// Seed demo spots trigger
	const handleSeedDemoSpots = async () => {
		try {
			setIsLoading(true);
			const { data } = await axios.post(
				"/api/spots/seed?force=true",
				{},
				{ withCredentials: true }
			);
			toast.success(data.message || "Demo spots seeded successfully!");
			await fetchSpots();
		} catch (err) {
			console.error("Failed to seed spots:", err);
			toast.error(err.response?.data?.message || "Unable to seed demo spots");
		} finally {
			setIsLoading(false);
		}
	};

	// Modal handling
	const handleOpenModal = (spot) => {
		const currentUserId = userInfo?._id || userInfo?.user?._id;
		if (currentUserId && spot.owner?._id === currentUserId) {
			toast.error("You are the host of this spot! Hosts manage their listings from the Host Dashboard.");
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

	// Synchronize card click with map marker
	const focusSpotOnMap = (spot) => {
		setSelectedSpot(spot);
		const lat = spot.location.coordinates[1];
		const lng = spot.location.coordinates[0];
		const target = [lat, lng];

		if (mapRef.current) {
			mapRef.current.flyTo(target, 16, { duration: 1.0 });
		}

		setTimeout(() => {
			const ref = markerRefs.current[spot._id];
			if (ref) ref.openPopup();
		}, 1050);
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

	return (
		<div className="min-h-screen bg-gray-50 pb-20">
			{/* Top Hero Section */}
			<section className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white py-8 px-4 shadow-md">
				<div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
					<div>
						<h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
							Find & Reserve Parking
						</h1>
						<p className="text-blue-100 text-xs sm:text-sm mt-1">
							Real-time discovery, verified amenities, and concurrency-safe reservations.
						</p>
					</div>

					{/* Search & Location Bar */}
					<div className="w-full md:w-auto flex-1 max-w-xl relative">
						<div className="relative flex items-center">
							<Search
								size={18}
								className="absolute left-3.5 text-gray-400 pointer-events-none"
							/>
							<input
								type="text"
								value={locationSearch}
								onChange={handleLocationSearchChange}
								placeholder="Search address, landmark, or city (e.g. Connaught Place, NYC)..."
								className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-white text-gray-800 text-xs sm:text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
							/>
							<button
								onClick={getUserLocation}
								className="absolute right-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
								title="Center to current GPS location"
							>
								<MapPin size={14} /> Near Me
							</button>
						</div>

						{/* Nominatim Search Dropdown Suggestions */}
						{locationResults.length > 0 && (
							<div className="absolute top-full left-0 right-0 mt-2 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden divide-y divide-gray-100">
								{locationResults.map((item, idx) => (
									<button
										key={idx}
										onClick={() => selectLocationResult(item)}
										className="w-full px-4 py-2.5 text-left text-xs hover:bg-blue-50 transition flex items-center gap-2"
									>
										<MapPin size={14} className="text-blue-600 shrink-0" />
										<span className="truncate">{item.display_name}</span>
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			</section>

			{/* Filter Toolbar */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
				<div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-3">
					{/* Quick Filter Badges */}
					<div className="flex flex-wrap items-center gap-2 text-xs">
						<button
							onClick={() => setShowFilterDrawer(!showFilterDrawer)}
							className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition ${
								showFilterDrawer
									? "bg-blue-600 text-white border-blue-600"
									: "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
							}`}
						>
							<SlidersHorizontal size={14} /> Filters
						</button>

						<button
							onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
							className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition ${
								showFavoritesOnly
									? "bg-rose-500 text-white border-rose-500"
									: "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
							}`}
						>
							<Heart
								size={14}
								className={showFavoritesOnly ? "fill-white" : ""}
							/>
							Favorites ({savedFavorites.length})
						</button>

						<button
							onClick={() => toggleAmenity("ev_charging")}
							className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1 transition ${
								selectedAmenities.includes("ev_charging")
									? "bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold"
									: "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
							}`}
						>
							<Zap size={14} /> EV Charging
						</button>

						<button
							onClick={() => toggleAmenity("covered")}
							className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1 transition ${
								selectedAmenities.includes("covered")
									? "bg-blue-50 text-blue-700 border-blue-300 font-semibold"
									: "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
							}`}
						>
							<ShieldCheck size={14} /> Covered
						</button>

						<button
							onClick={() => toggleAmenity("cctv")}
							className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1 transition ${
								selectedAmenities.includes("cctv")
									? "bg-purple-50 text-purple-700 border-purple-300 font-semibold"
									: "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
							}`}
						>
							<ShieldCheck size={14} /> CCTV
						</button>

						<button
							onClick={toggleHeatmap}
							className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition ${
								showHeatmap
									? "bg-gradient-to-r from-amber-500 to-rose-600 text-white border-transparent shadow-xs"
									: "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
							}`}
							title="Toggle parking demand density heatmap"
						>
							<Flame size={14} className={showHeatmap ? "text-white" : "text-amber-500"} />
							Demand Heatmap
						</button>
					</div>

					{/* Sort & Count */}
					<div className="flex items-center gap-3 text-xs">
						<span className="text-gray-500 font-medium hidden sm:inline">
							Sort by:
						</span>
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value)}
							className="border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
						>
							<option value="distance">Nearest Distance</option>
							<option value="price_asc">Price: Low to High</option>
							<option value="price_desc">Price: High to Low</option>
							<option value="rating_desc">Highest Rating</option>
						</select>

						{(maxPrice < 50 ||
							spotType !== "all" ||
							vehicleSize !== "any" ||
							selectedAmenities.length > 0 ||
							showFavoritesOnly) && (
							<button
								onClick={resetFilters}
								className="text-gray-500 hover:text-rose-600 flex items-center gap-1 text-xs"
								title="Reset all filters"
							>
								<RotateCcw size={12} /> Reset
							</button>
						)}
					</div>
				</div>

				{/* Expanded Filter Drawer */}
				{showFilterDrawer && (
					<div className="mt-3 bg-white rounded-2xl p-5 shadow-md border border-gray-100 grid sm:grid-cols-2 md:grid-cols-4 gap-6 text-xs">
						{/* Radius Slider */}
						<div>
							<div className="flex justify-between font-semibold text-gray-700 mb-1">
								<span>Search Radius:</span>
								<span className="text-blue-600">{radiusKm} km</span>
							</div>
							<input
								type="range"
								min="1"
								max="50"
								value={radiusKm}
								onChange={(e) => setRadiusKm(Number(e.target.value))}
								className="w-full accent-blue-600 cursor-pointer"
							/>
						</div>

						{/* Price Slider */}
						<div>
							<div className="flex justify-between font-semibold text-gray-700 mb-1">
								<span>Max Price:</span>
								<span className="text-blue-600">
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
								className="w-full accent-blue-600 cursor-pointer"
							/>
						</div>

						{/* Vehicle Size */}
						<div>
							<span className="font-semibold text-gray-700 block mb-1.5">
								Vehicle Compatibility:
							</span>
							<select
								value={vehicleSize}
								onChange={(e) => setVehicleSize(e.target.value)}
								className="w-full border border-gray-200 rounded-lg p-2 bg-gray-50 text-xs"
							>
								<option value="any">Any Vehicle Size</option>
								<option value="compact">Compact / Hatchback</option>
								<option value="sedan">Sedan</option>
								<option value="suv">SUV / Truck</option>
							</select>
						</div>

						{/* Spot Type */}
						<div>
							<span className="font-semibold text-gray-700 block mb-1.5">
								Listing Type:
							</span>
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
										className={`py-1.5 rounded-lg font-medium text-center transition ${
											spotType === t.key
												? "bg-blue-600 text-white font-semibold"
												: "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
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

			{/* Main Discovery Layout: Map + Card List */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 grid lg:grid-cols-12 gap-6">
				{/* Map Area (7 Cols on LG) */}
				<div className="lg:col-span-7 bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 relative h-[70vh]">
					{isLoading && (
						<div className="absolute inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur-xs">
							<div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-lg border border-gray-100 text-xs font-semibold text-blue-600">
								<div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
								Updating map spots...
							</div>
						</div>
					)}

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

						{/* Search Radius Circle */}
						<Circle
							center={position}
							radius={radiusKm * 1000}
							pathOptions={{
								color: "#2563eb",
								fillColor: "#3b82f6",
								fillOpacity: 0.12,
								weight: 1.5,
							}}
						/>

						{/* Geospatial Demand Heatmap Overlay */}
						{showHeatmap &&
							heatmapPoints.map((hp) => (
								<Circle
									key={`heat-${hp._id}`}
									center={[hp.lat, hp.lng]}
									radius={850}
									pathOptions={{
										color:
											hp.intensity >= 0.75
												? "#dc2626"
												: hp.intensity >= 0.5
												? "#f59e0b"
												: "#2563eb",
										fillColor:
											hp.intensity >= 0.75
												? "#ef4444"
												: hp.intensity >= 0.5
												? "#fbbf24"
												: "#60a5fa",
										fillOpacity: 0.35,
										weight: 1,
									}}
								>
									<Popup>
										<div className="text-xs space-y-1">
											<p className="font-bold text-gray-800 flex items-center gap-1">
												<Flame size={12} className="text-rose-500" />
												Demand Density: {Math.round(hp.intensity * 100)}%
											</p>
											<p className="text-gray-600 line-clamp-1">{hp.title}</p>
											<p className="font-semibold text-blue-600">
												Base: ${hp.pricePerHour}/hr
											</p>
										</div>
									</Popup>
								</Circle>
							))}

						{/* Markers for all spots */}
						{spots.map((spot) => {
							const lat = spot.location.coordinates[1];
							const lng = spot.location.coordinates[0];
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
												<span className="font-bold text-gray-900 text-sm">
													${spot.pricePerHour}/hr
												</span>
												<span
													className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
														spot.spotType === "operator"
															? "bg-purple-100 text-purple-700"
															: "bg-emerald-100 text-emerald-700"
													}`}
												>
													{spot.spotType === "operator" ? "Hub" : "P2P"}
												</span>
											</div>
											<h4 className="font-semibold text-gray-800 line-clamp-1">
												{spot.title || spot.address}
											</h4>
											<p className="text-gray-500 line-clamp-2 text-[11px]">
												{spot.address}
											</p>
											<div className="flex items-center justify-between pt-1 border-t border-gray-100">
												<Link
													to={`/spots/${spot._id}`}
													className="text-blue-600 hover:underline font-semibold flex items-center gap-0.5 text-[11px]"
												>
													Details <ArrowUpRight size={12} />
												</Link>
												{spot.owner?._id === (userInfo?._id || userInfo?.user?._id) ? (
													<button
														onClick={() => navigate(`/host/edit-spot/${spot._id}`)}
														className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold px-2.5 py-1 rounded-md text-[11px]"
													>
														Manage
													</button>
												) : (
													<button
														onClick={() => handleOpenModal(spot)}
														className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1 rounded-md text-[11px]"
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

				{/* Cards Side List (5 Cols on LG) */}
				<div className="lg:col-span-5 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-5 h-[70vh] flex flex-col">
					<div className="flex items-center justify-between pb-3 border-b border-gray-100">
						<div>
							<h3 className="font-bold text-gray-900 text-base">
								Available Spaces ({spots.length})
							</h3>
							<p className="text-[11px] text-gray-400">
								Within {radiusKm} km radius
							</p>
						</div>
						<button
							onClick={fetchSpots}
							className="text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-blue-600 font-semibold transition"
						>
							Refresh
						</button>
					</div>

					{/* Spot Cards Container */}
					<div className="flex-1 overflow-y-auto pt-3 space-y-3 pr-1">
						{!spots.length && !isLoading ? (
							<div className="text-center py-10 space-y-3">
								<div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
									<Layers size={22} />
								</div>
								<h4 className="font-bold text-gray-800 text-sm">
									No parking spots in this radius
								</h4>
								<p className="text-xs text-gray-500 max-w-xs mx-auto">
									Try expanding your search radius, adjusting filters, or seed demo parking spaces to explore.
								</p>
								<div className="pt-2 flex flex-col gap-2">
									<button
										onClick={() => setRadiusKm(30)}
										className="text-xs font-semibold text-blue-600 hover:underline"
									>
										Expand radius to 30 km
									</button>
									<button
										onClick={handleSeedDemoSpots}
										className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow hover:shadow-md transition mx-auto"
									>
										<Sparkles size={14} /> Populate Realistic Demo Spots
									</button>
								</div>
							</div>
						) : (
							spots.map((spot) => {
								const isSelected = selectedSpot?._id === spot._id;
								const isFav = savedFavorites.includes(spot._id);

								return (
									<div
										key={spot._id}
										ref={(el) => (cardRefs.current[spot._id] = el)}
										onClick={() => focusSpotOnMap(spot)}
										className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
											isSelected
												? "border-blue-500 ring-2 ring-blue-100 bg-blue-50/20 shadow-md"
												: "border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white"
										}`}
									>
										<div className="flex items-start justify-between gap-2">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-1">
													<span
														className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
															spot.spotType === "operator"
																? "bg-purple-100 text-purple-700"
																: "bg-emerald-100 text-emerald-700"
														}`}
													>
														{spot.spotType === "operator" ? "Hub" : "P2P"}
													</span>
													{spot.owner?._id === (userInfo?._id || userInfo?.user?._id) && (
														<span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
															Your Space
														</span>
													)}
													{spot.distanceKm !== null &&
														spot.distanceKm !== undefined && (
															<span className="text-[11px] text-gray-500 font-medium">
																• {spot.distanceKm} km away
															</span>
														)}
												</div>

												<h4 className="font-semibold text-gray-900 text-sm truncate">
													{spot.title || spot.address}
												</h4>
												<p className="text-xs text-gray-500 truncate mt-0.5">
													{spot.address}
												</p>
											</div>

											{/* Price & Favorite */}
											<div className="text-right shrink-0">
												<div className="text-base font-extrabold text-blue-600">
													${spot.pricePerHour}
													<span className="text-[10px] text-gray-400 font-normal">
														/hr
													</span>
												</div>
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														toggleFavorite(spot._id);
													}}
													className="mt-1 p-1 text-gray-400 hover:text-rose-500 transition"
													title={isFav ? "Saved" : "Save spot"}
												>
													<Heart
														size={16}
														className={
															isFav ? "fill-rose-500 text-rose-500" : ""
														}
													/>
												</button>
											</div>
										</div>

										{/* Amenity Pills */}
										<div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px]">
											{spot.rating > 0 && (
												<span className="inline-flex items-center gap-0.5 font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
													<Star size={10} className="fill-amber-400" />{" "}
													{spot.rating.toFixed(1)}
												</span>
											)}
											{spot.vehicleSize && spot.vehicleSize !== "any" && (
												<span className="inline-flex items-center gap-0.5 text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
													<Car size={10} /> {spot.vehicleSize.toUpperCase()}
												</span>
											)}
											{spot.amenities?.includes("covered") && (
												<span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
													Covered
												</span>
											)}
											{spot.amenities?.includes("ev_charging") && (
												<span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">
													EV
												</span>
											)}
											{spot.amenities?.includes("cctv") && (
												<span className="bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
													CCTV
												</span>
											)}
										</div>

										{/* Action Buttons */}
										<div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
											<Link
												to={`/spots/${spot._id}`}
												onClick={(e) => e.stopPropagation()}
												className="text-xs font-semibold text-gray-600 hover:text-blue-600 flex items-center gap-1 transition"
											>
												View Details <ArrowUpRight size={13} />
											</Link>

											<div className="flex items-center gap-2">
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														focusSpotOnMap(spot);
													}}
													className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition"
												>
													Map Pin
												</button>
												{spot.owner?._id === (userInfo?._id || userInfo?.user?._id) ? (
													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															navigate(`/host/edit-spot/${spot._id}`);
														}}
														className="px-3 py-1 text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold rounded-lg shadow-xs transition"
													>
														Manage
													</button>
												) : (
													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															handleOpenModal(spot);
														}}
														className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition"
													>
														Book
													</button>
												)}
											</div>
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>
			</div>

			{isModalOpen && bookingSpot && (
				<BookingModal spot={bookingSpot} onClose={handleCloseModal} />
			)}
		</div>
	);
};

export default MapPage;
