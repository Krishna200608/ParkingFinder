import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

/** Fix map resize issue inside modal **/
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
	const [bookedSlots, setBookedSlots] = useState([]);
	const [suggestedSlots, setSuggestedSlots] = useState([]);

	// --- Helper: combine date + time ---
	const getDateTime = (date, time) => {
		if (!date || !time) return null;
		return new Date(`${date}T${time}`);
	};

	// --- Fetch booked and suggested slots only once when modal opens ---
	useEffect(() => {
		if (!spot?._id) return;

		const fetchSlotData = async () => {
			try {
				const { data } = await axios.get(`/api/bookings/spot/${spot._id}`);
				setBookedSlots(data.bookedSlots || []);
				setSuggestedSlots(data.suggestedSlots || []);
			} catch (err) {
				console.error("Error fetching booked slots:", err);
			}
		};

		fetchSlotData();
	}, [spot]);

	// --- Calculate price when inputs change ---
	useEffect(() => {
		const start = getDateTime(startDate, startTime);
		const end = getDateTime(endDate, endTime);

		if (!start || !end || !spot?.pricePerHour) {
			setTotalPrice(0);
			return;
		}

		if (startDate !== endDate) {
			toast.error("Booking must be on the same day");
			setTotalPrice(0);
			return;
		}

		if (end <= start) {
			toast.error("End time must be after start time");
			setTotalPrice(0);
			return;
		}

		const diffHours = (end - start) / (1000 * 60 * 60);
		setTotalPrice(
			diffHours > 0 ? Math.round(diffHours * spot.pricePerHour * 100) / 100 : 0
		);
	}, [startDate, startTime, endDate, endTime, spot]);

	// --- Validate all required inputs ---
	const isFormValid = () => {
		const start = getDateTime(startDate, startTime);
		const end = getDateTime(endDate, endTime);
		return (
			!!userInfo &&
			start &&
			end &&
			startDate === endDate &&
			end > start &&
			totalPrice > 0
		);
	};

	const handleBook = async () => {
		if (!isFormValid()) {
			toast.error("Fill all required details before booking");
			return;
		}

		try {
			setIsLoading(true);
			const start = getDateTime(startDate, startTime);
			const end = getDateTime(endDate, endTime);

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
			toast.error(
				err?.response?.data?.message ||
					"Booking failed. Please choose a different time slot."
			);
			onClose(false);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
			<div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-lg relative">
				<h3 className="text-lg font-semibold mb-2">Reserve Spot</h3>
				<p className="text-sm text-gray-600 mb-4">
					{spot.address || spot.name}
				</p>

				{/* --- Map Preview --- */}
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

				{/* --- Booked Slots --- */}
				{bookedSlots.filter((b) => new Date(b.endTime) > new Date()).length >
				0 ? (
					<div className="mb-4">
						<h4 className="text-sm font-semibold mb-1 text-red-600">
							Already Booked Slots
						</h4>
						<ul className="text-xs text-gray-700 bg-red-50 p-2 rounded max-h-28 overflow-auto">
							{bookedSlots
								.filter((b) => new Date(b.endTime) > new Date()) // only future
								.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
								.map((b, i) => {
									const start = new Date(b.startTime);
									const end = new Date(b.endTime);
									const isToday =
										start.toDateString() === new Date().toDateString();
									return (
										<li key={i}>
											{isToday
												? "Today"
												: start.toLocaleDateString(undefined, {
														day: "2-digit",
														month: "short",
														year: "numeric",
												  })}
											:{" "}
											{start.toLocaleTimeString([], {
												hour: "2-digit",
												minute: "2-digit",
												hour12: true, // ✅ show AM/PM
											})}{" "}
											–{" "}
											{end.toLocaleTimeString([], {
												hour: "2-digit",
												minute: "2-digit",
												hour12: true, // ✅ show AM/PM
											})}
										</li>
									);
								})}
						</ul>
					</div>
				) : (
					<p className="text-xs text-gray-500 mb-3">
						No upcoming bookings for this spot.
					</p>
				)}

				{/* --- Suggested Slots --- */}
				{suggestedSlots.length > 0 && (
					<div className="mb-4">
						<h4 className="text-sm font-semibold mb-1 text-green-600">
							Suggested Available 1-hour Slots (Today)
						</h4>
						<div className="flex flex-wrap gap-2">
							{suggestedSlots.map((slot, idx) => {
								const start = new Date(slot.start);
								const end = new Date(slot.end);

								// Format in local time with AM/PM
								const label = `${start.toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
									hour12: true,
								})} - ${end.toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
									hour12: true,
								})}`;

								return (
									<button
										key={idx}
										className="border px-2 py-1 rounded text-xs hover:bg-blue-50"
										onClick={() => {
											const pad = (n) => String(n).padStart(2, "0");

											// Local date parts (not UTC)
											const localDate = new Date();
											localDate.setHours(
												start.getHours(),
												start.getMinutes(),
												0,
												0
											);

											const startDateStr = `${start.getFullYear()}-${pad(
												start.getMonth() + 1
											)}-${pad(start.getDate())}`;

											const endDateStr = startDateStr; // always same day
											const startTimeStr = `${pad(start.getHours())}:${pad(
												start.getMinutes()
											)}`;
											const endTimeStr = `${pad(end.getHours())}:${pad(
												end.getMinutes()
											)}`;

											setStartDate(startDateStr);
											setEndDate(endDateStr);
											setStartTime(startTimeStr);
											setEndTime(endTimeStr);
										}}
									>
										{label}
									</button>
								);
							})}
						</div>
					</div>
				)}

				{/* --- Date + Time Inputs --- */}
				<div className="grid grid-cols-2 gap-3 mb-4">
					<div>
						<label className="text-xs text-gray-500">Start Date</label>
						<input
							type="date"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							className="w-full border px-3 py-2 rounded"
						/>
					</div>
					<div>
						<label className="text-xs text-gray-500">End Date</label>
						<input
							type="date"
							value={endDate}
							onChange={(e) => setEndDate(e.target.value)}
							className="w-full border px-3 py-2 rounded"
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-3 mb-4">
					<div>
						<label className="text-xs text-gray-500">Start Time</label>
						<input
							type="time"
							value={startTime}
							onChange={(e) => setStartTime(e.target.value)}
							step="900"
							className="w-full border px-3 py-2 rounded"
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
						/>
					</div>
				</div>

				{/* --- Price and Notes --- */}
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

				{/* --- Buttons --- */}
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
						className={`px-4 py-2 rounded text-white ${
							isFormValid()
								? "bg-blue-600 hover:bg-blue-700"
								: "bg-gray-400 cursor-not-allowed"
						}`}
						disabled={isLoading || !isFormValid()}
					>
						{isLoading ? "Booking..." : `Book $${totalPrice.toFixed(2)}`}
					</button>
				</div>
			</div>
		</div>
	);
};

export default BookingModal;
