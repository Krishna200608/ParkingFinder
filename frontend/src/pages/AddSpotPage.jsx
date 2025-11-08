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
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useAuth } from "../context/AuthContext";

const DefaultIcon = L.icon({
	iconUrl: markerIcon,
	shadowUrl: markerShadow,
	iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// 🔹 Reverse geocode helper using OpenStreetMap Nominatim
const fetchAddress = async (lat, lng) => {
	try {
		const res = await fetch(
			`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
		);
		const data = await res.json();
		return (
			data.display_name || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
		);
	} catch {
		return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
	}
};

// 🧭 Component that handles map click for placing marker
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

// 🔄 Smooth fly animation for map
function FlyToHelper({ target }) {
	const map = useMap();
	useEffect(() => {
		if (target && map) {
			map.flyTo(target, 14, { duration: 1.2 });
		}
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

	const [coordinates, setCoordinates] = useState(null);
	const [mapCenter, setMapCenter] = useState([28.6139, 77.209]);
	const [loading, setLoading] = useState(false);
	const mapRef = useRef(null);

	// 📍 Automatically center map on user’s location (initial)
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

	// 📍 Handle “My Location” button
	const handleMyLocation = () => {
		if (!navigator.geolocation) {
			toast.error("Geolocation is not supported by your browser");
			return;
		}

		toast.loading("Fetching your current location...", { id: "geo" });

		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const lat = position.coords.latitude;
				const lng = position.coords.longitude;
				const coords = [lat, lng];

				setMapCenter(coords);
				setCoordinates(coords);

				try {
					const addr = await fetchAddress(lat, lng);
					setFormData((prev) => ({ ...prev, address: addr }));
					toast.success("Location detected successfully!", { id: "geo" });
				} catch {
					toast.error("Unable to fetch address", { id: "geo" });
				}

				// ✅ ensure mapRef is valid
				if (mapRef.current && mapRef.current.flyTo) {
					mapRef.current.flyTo(coords, 16, { duration: 1.2 });
				}
			},
			(error) => {
				toast.dismiss("geo");
				console.error("Geolocation error:", error);
				switch (error.code) {
					case error.PERMISSION_DENIED:
						toast.error("Location permission denied. Please allow it.");
						break;
					case error.POSITION_UNAVAILABLE:
						toast.error("Location unavailable.");
						break;
					case error.TIMEOUT:
						toast.error("Location request timed out.");
						break;
					default:
						toast.error("Failed to get location.");
				}
			},
			{ enableHighAccuracy: true, timeout: 10000 }
		);
	};

	// 🔄 Handle form field change
	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	// 🧾 Handle form submission
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
			const config = {
				withCredentials: true,
				headers: {},
			};
			if (userInfo?.token) {
				config.headers.Authorization = `Bearer ${userInfo.token}`;
			}

			await axios.post(
				"/api/spots/available",
				{ ...formData, latitude, longitude },
				config
			);

			toast.success("Parking spot added successfully!");
			navigate("/host/dashboard");
		} catch (error) {
			console.error("Error adding spot:", error);
			toast.error(
				error.response?.data?.message || "Failed to add parking spot"
			);
		} finally {
			setLoading(false);
		}
	};

	// 🧲 Handle marker drag updates
	const handleMarkerDrag = async (e) => {
		const lat = e.target.getLatLng().lat;
		const lng = e.target.getLatLng().lng;
		const addr = await fetchAddress(lat, lng);
		setCoordinates([lat, lng]);
		setFormData((prev) => ({ ...prev, address: addr }));
		toast("Marker moved — address updated");
	};

	return (
		<div className="grid md:grid-cols-2 gap-6">
			{/* 🗺️ Map Section */}
			<div className="bg-white p-4 rounded-lg shadow-md relative">
				<h2 className="text-lg font-semibold mb-2">Select Parking Location</h2>
				<p className="text-sm text-gray-500 mb-3">
					Click on the map or drag the marker to set your parking spot.
				</p>

				{/* 📍 My Location Button (left side) */}
				<button
					onClick={handleMyLocation}
					className="absolute top-4 left-4 z-40 bg-blue-600 text-white px-3 py-2 rounded shadow hover:bg-blue-700"
				>
					📍 My Location
				</button>

				<div className="h-[65vh] rounded overflow-hidden shadow-sm">
					<MapContainer
						center={mapCenter}
						zoom={13}
						style={{ height: "100%", width: "100%" }}
						whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
					>
						<TileLayer
							attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
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
							<Marker
								position={coordinates}
								draggable={true}
								eventHandlers={{
									dragend: handleMarkerDrag,
								}}
							/>
						)}
					</MapContainer>
				</div>
			</div>

			{/* 🧾 Form Section */}
			<div className="bg-white p-6 rounded-lg shadow-md">
				<h2 className="text-lg font-semibold mb-4">Add New Parking Spot</h2>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium mb-1">Spot Type</label>
						<div className="flex items-center gap-6">
							<label className="flex items-center gap-2">
								<input
									type="radio"
									name="spotType"
									value="operator"
									checked={formData.spotType === "operator"}
									onChange={handleChange}
									className="accent-blue-600"
								/>
								<span className="text-sm">Operator (Commercial Lot)</span>
							</label>

							<label className="flex items-center gap-2">
								<input
									type="radio"
									name="spotType"
									value="p2p"
									checked={formData.spotType === "p2p"}
									onChange={handleChange}
									className="accent-blue-600"
								/>
								<span className="text-sm">P2P (Host-Owned Spot)</span>
							</label>
						</div>
						<p className="text-xs text-gray-500 mt-1">
							Choose <strong>Operator</strong> for a commercial lot or{" "}
							<strong>P2P</strong> if you’re listing your own space.
						</p>
					</div>

					<div>
						<label className="block text-sm font-medium">Address</label>
						<input
							type="text"
							name="address"
							value={formData.address}
							onChange={handleChange}
							className="w-full border rounded px-3 py-2"
							placeholder="Click map or drag marker"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block text-sm font-medium">Latitude</label>
							<input
								type="text"
								value={coordinates ? coordinates[0].toFixed(5) : ""}
								readOnly
								className="w-full border rounded px-3 py-2 bg-gray-100"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium">Longitude</label>
							<input
								type="text"
								value={coordinates ? coordinates[1].toFixed(5) : ""}
								readOnly
								className="w-full border rounded px-3 py-2 bg-gray-100"
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium">Description</label>
						<textarea
							name="description"
							rows="3"
							value={formData.description}
							onChange={handleChange}
							className="w-full border rounded px-3 py-2"
							placeholder="Add optional details"
						></textarea>
					</div>

					<div>
						<label className="block text-sm font-medium">
							Price Per Hour ($)
						</label>
						<input
							type="number"
							step="0.01"
							name="pricePerHour"
							value={formData.pricePerHour}
							onChange={handleChange}
							className="w-full border rounded px-3 py-2"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className={`w-full py-2 rounded text-white ${
							loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
						}`}
					>
						{loading ? "Adding..." : "Add Spot"}
					</button>
				</form>
			</div>
		</div>
	);
};

export default AddSpotPage;
