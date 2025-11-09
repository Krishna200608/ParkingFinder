import React, { useState, useEffect, useRef } from "react";
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
import { MapPin } from "lucide-react";

const DefaultIcon = L.icon({
	iconUrl: markerIcon,
	shadowUrl: markerShadow,
	iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function FlyToHelper({ mapRef, target, zoom }) {
	const map = useMap();
	useEffect(() => {
		if (target && map) map.flyTo(target, zoom, { duration: 1.2 });
	}, [target, map, zoom]);
	return null;
}

const MapPage = () => {
	const { userInfo } = useAuth();
	const [spots, setSpots] = useState([]);
	const [selectedSpot, setSelectedSpot] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [bookingSpot, setBookingSpot] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [position, setPosition] = useState([28.6139, 77.209]);
	const [radiusKm, setRadiusKm] = useState(5);
	const [zoom, setZoom] = useState(14);
	const mapRef = useRef();
	const markerRefs = useRef({});

	// Adjust zoom based on radius
	useEffect(() => {
		const calculatedZoom = Math.max(10, Math.min(16, 16 - Math.log2(radiusKm)));
		setZoom(calculatedZoom);
		fetchSpots();
		if (mapRef.current) {
			mapRef.current.flyTo(position, calculatedZoom, { duration: 1.2 });
		}
	}, [radiusKm, position]);

	const fetchSpots = async () => {
		try {
			if (!position) return;
			setIsLoading(true);
			const radiusMeters = radiusKm * 1000;

			const { data } = await axios.get("/api/spots/available", {
				params: { lat: position[0], lng: position[1], radius: radiusMeters },
				withCredentials: true,
				headers: userInfo?.token
					? { Authorization: `Bearer ${userInfo.token}` }
					: {},
			});

			const filtered = Array.isArray(data)
				? data.filter((s) => s.owner?._id !== userInfo?.user?._id)
				: [];
			setSpots(filtered);
		} catch (err) {
			console.error("Failed to fetch spots:", err);
			toast.error("Unable to load spots");
		} finally {
			setIsLoading(false);
		}
	};

	const handleOpenModal = (spot) => {
		setBookingSpot(spot);
		setIsModalOpen(true);
	};

	const handleCloseModal = (success) => {
		setIsModalOpen(false);
		setBookingSpot(null);
		if (success) fetchSpots();
	};

	const getUserLocation = async () => {
		if (!navigator.geolocation) {
			toast.error("Geolocation is not supported by your browser");
			return;
		}

		try {
			const permission = await navigator.permissions.query({
				name: "geolocation",
			});
			if (permission.state === "denied") {
				toast.error(
					"Location access is blocked. Enable it in browser settings."
				);
				return;
			}

			navigator.geolocation.getCurrentPosition(
				(pos) => {
					const coords = [pos.coords.latitude, pos.coords.longitude];
					setPosition(coords);
					mapRef.current?.flyTo(coords, 15, { duration: 1.2 });
					toast.success("Centered to your location");
				},
				(error) => {
					switch (error.code) {
						case 1:
							toast.error("Permission denied — please allow location access");
							break;
						case 2:
							toast.error("Location unavailable");
							break;
						case 3:
							toast.error("Location request timed out");
							break;
						default:
							toast.error("Unable to fetch location");
					}
				},
				{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
			);
		} catch (err) {
			toast.error("Could not verify location permissions");
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 pb-20">
			{/* Header */}
			<section className="bg-gradient-to-r from-blue-600 to-blue-400 text-white py-8 text-center shadow">
				<h1 className="text-3xl font-bold mb-1">Find Parking Near You</h1>
				<p className="text-blue-100 text-sm">
					Explore available parking spots within your preferred distance.
				</p>
			</section>

			{/* Main Layout */}
			<div className="max-w-7xl mx-auto px-6 mt-10 grid md:grid-cols-3 gap-8">
				{/* Map Column */}
				<div className="md:col-span-2 relative bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
					<div className="absolute top-4 left-15 z-40">
						<button
							onClick={getUserLocation}
							className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-md text-sm flex items-center gap-2"
						>
							<MapPin size={16} /> My Location
						</button>
					</div>

					<div className="absolute top-4 right-4 z-40 bg-white px-3 py-2 rounded-md shadow text-sm w-48">
						<label
							htmlFor="radius"
							className="block text-xs font-semibold mb-1"
						>
							Search Radius: {radiusKm} km
						</label>
						<input
							id="radius"
							type="range"
							min="1"
							max="50"
							step="1"
							value={radiusKm}
							onChange={(e) => setRadiusKm(Number(e.target.value))}
							className="w-full accent-blue-600 cursor-pointer"
						/>
					</div>

					<div className="h-[72vh] w-full">
						{isLoading && (
							<div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
								<div className="text-white text-lg">Loading map & spots...</div>
							</div>
						)}

						<MapContainer
							center={position}
							zoom={zoom}
							style={{ height: "100%", width: "100%" }}
							whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
						>
							<TileLayer
								attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
								url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
							/>
							<FlyToHelper mapRef={mapRef} target={position} zoom={zoom} />

							{/* Search radius circle */}
							<Circle
								center={position}
								radius={radiusKm * 1000}
								pathOptions={{
									color: "#2563eb",
									fillColor: "#3b82f6",
									fillOpacity: 0.15,
								}}
							/>

							{/* Markers */}
							{spots.map((spot) => {
								const lat = spot.location.coordinates[1];
								const lng = spot.location.coordinates[0];
								return (
									<Marker
										key={spot._id}
										ref={(ref) => (markerRefs.current[spot._id] = ref)}
										position={[lat, lng]}
										eventHandlers={{ click: () => setSelectedSpot(spot) }}
									>
										{selectedSpot?._id === spot._id && (
											<Popup autoClose={false} autoPan>
												<div className="space-y-2">
													<h3 className="font-semibold text-sm text-blue-700">
														📍 This parking spot is here!
													</h3>
													<p className="text-xs text-gray-600">
														{spot.address || "No address available"}
													</p>
													<p className="text-xs text-gray-500">
														{spot.description ||
															"You’re now focused on this specific parking location."}
													</p>
													<div className="flex justify-between items-center mt-2">
														<span className="text-sm font-semibold text-blue-600">
															${spot.pricePerHour}/hr
														</span>
														<button
															onClick={() => handleOpenModal(spot)}
															className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
														>
															Book
														</button>
													</div>
												</div>
											</Popup>
										)}
									</Marker>
								);
							})}
						</MapContainer>
					</div>
				</div>

				{/* Side List */}
				<aside className="bg-white rounded-xl shadow-lg p-5 border border-gray-100 h-[72vh] overflow-auto">
					<div className="flex items-center justify-between mb-4">
						<h4 className="font-semibold text-gray-800 text-lg">
							Available Spots ({spots.length})
						</h4>
						<button
							onClick={fetchSpots}
							className="text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-blue-600"
						>
							Refresh
						</button>
					</div>

					{!spots.length && !isLoading ? (
						<div className="text-sm text-gray-500 mt-6">
							No spots available within {radiusKm} km.
						</div>
					) : (
						<ul className="space-y-3">
							{spots.map((spot) => {
								const lat = spot.location.coordinates[1];
								const lng = spot.location.coordinates[0];
								return (
									<li
										key={spot._id}
										className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
									>
										<div className="flex justify-between items-start mb-2">
											<div>
												<h5 className="font-medium text-gray-800 text-sm">
													{spot.address || "Unnamed Spot"}
												</h5>
												<p className="text-xs text-gray-500 line-clamp-2">
													{spot.description || "No description available"}
												</p>
											</div>
											<div className="text-right">
												<div className="text-sm font-semibold text-blue-600">
													${spot.pricePerHour}/hr
												</div>
											</div>
										</div>

										<div className="mt-3 flex gap-2">
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleOpenModal(spot);
												}}
												className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
											>
												Book
											</button>

											{/* Navigate Button with close zoom and popup */}
											<button
												onClick={(e) => {
													e.stopPropagation();
													const target = [lat, lng];
													setPosition(target);
													setSelectedSpot(spot);

													if (mapRef.current) {
														mapRef.current.flyTo(target, 19, { duration: 1.3 });
													}

													// Open popup after zoom animation
													setTimeout(() => {
														const ref = markerRefs.current[spot._id];
														if (ref) ref.openPopup();
													}, 1300);

													toast.success(
														`Navigated to "${spot.address || "Parking Spot"}"`
													);
												}}
												className="border border-blue-200 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-50 transition"
											>
												Navigate
											</button>
										</div>
									</li>
								);
							})}
						</ul>
					)}
				</aside>
			</div>

			{isModalOpen && bookingSpot && (
				<BookingModal spot={bookingSpot} onClose={handleCloseModal} />
			)}
		</div>
	);
};

export default MapPage;
