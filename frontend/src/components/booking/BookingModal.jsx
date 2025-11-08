import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

/** Fix map size after render **/
function MapFixer() {
	const map = useMap();
	useEffect(() => {
		setTimeout(() => {
			map.invalidateSize();
			map.flyTo(map.getCenter(), map.getZoom());
		}, 300);
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

	const getDateTime = (date, time) => {
		if (!date || !time) return null;
		return new Date(`${date}T${time}`);
	};

	useEffect(() => {
		if (!spot?._id) return;
		const fetchSlots = async () => {
			try {
				const { data } = await axios.get(`/api/bookings/spot/${spot._id}`);
				setBookedSlots(data.bookedSlots || []);
				setSuggestedSlots(data.suggestedSlots || []);
			} catch (err) {
				console.error("Error fetching slots:", err);
			}
		};
		fetchSlots();
	}, [spot]);

	useEffect(() => {
		const start = getDateTime(startDate, startTime);
		const end = getDateTime(endDate, endTime);

		if (!start || !end || !spot?.pricePerHour) return setTotalPrice(0);

		if (startDate !== endDate) {
			toast.error("Booking must be on the same day");
			return setTotalPrice(0);
		}
		if (end <= start) {
			toast.error("End time must be after start time");
			return setTotalPrice(0);
		}

		const diffHours = (end - start) / (1000 * 60 * 60);
		setTotalPrice(diffHours * spot.pricePerHour);
	}, [startDate, startTime, endDate, endTime, spot]);

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
		if (!isFormValid()) return toast.error("Please fill all required details");
		try {
			setIsLoading(true);
			const start = getDateTime(startDate, startTime);
			const end = getDateTime(endDate, endTime);

			await axios.post("/api/bookings", {
				spotId: spot._id,
				startTime: start.toISOString(),
				endTime: end.toISOString(),
				notes,
			});

			toast.success("Booked successfully!");
			onClose(true);
		} catch (err) {
			console.error(err);
			toast.error(
				err?.response?.data?.message || "Booking failed. Please try again."
			);
			onClose(false);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex justify-center backdrop-blur-md bg-black/40 animate-fadeIn overflow-y-auto"
			role="dialog"
		>
			<div className="w-full flex justify-center py-10">
				{/* Modal Card */}
				<div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 relative border border-gray-100 transition-transform transform animate-slideUp flex flex-col max-h-[90vh]">
					{/* Header (always visible) */}
					<div className="flex justify-between items-start p-6 border-b sticky top-0 bg-white z-10">
						<div>
							<h3 className="text-2xl font-semibold text-gray-800">
								Reserve Spot
							</h3>
							<p className="text-sm text-gray-500">{spot.address}</p>
						</div>
						<button
							onClick={() => onClose(false)}
							className="text-gray-400 hover:text-gray-600 text-xl"
						>
							✕
						</button>
					</div>

					{/* Scrollable body */}
					<div className="overflow-y-auto p-6 space-y-5">
						{/* Map */}
						{spot?.location?.coordinates && (
							<div className="rounded-lg overflow-hidden shadow-sm border border-gray-100">
								<MapContainer
									center={[
										spot.location.coordinates[1],
										spot.location.coordinates[0],
									]}
									zoom={15}
									style={{ height: "230px", width: "100%" }}
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

						{/* Booked Slots */}
						{bookedSlots.filter((b) => new Date(b.endTime) > new Date())
							.length > 0 ? (
							<div>
								<h4 className="text-sm font-semibold mb-1 text-red-600">
									Already Booked Slots
								</h4>
								<ul className="text-xs text-gray-700 bg-red-50 p-2 rounded max-h-28 overflow-auto">
									{bookedSlots
										.filter((b) => new Date(b.endTime) > new Date())
										.sort(
											(a, b) => new Date(a.startTime) - new Date(b.startTime)
										)
										.map((b, i) => {
											const start = new Date(b.startTime);
											const end = new Date(b.endTime);
											const isToday =
												start.toDateString() === new Date().toDateString();
											return (
												<li key={i}>
													{isToday ? "Today" : start.toLocaleDateString()} :{" "}
													{start.toLocaleTimeString([], {
														hour: "2-digit",
														minute: "2-digit",
														hour12: true,
													})}{" "}
													–{" "}
													{end.toLocaleTimeString([], {
														hour: "2-digit",
														minute: "2-digit",
														hour12: true,
													})}
												</li>
											);
										})}
								</ul>
							</div>
						) : (
							<p className="text-xs text-gray-500">
								No upcoming bookings for this spot.
							</p>
						)}

						{/* Suggested Slots */}
						{suggestedSlots.length > 0 && (
							<div>
								<h4 className="text-sm font-semibold mb-1 text-green-600">
									Suggested Available Slots (Today)
								</h4>
								<div className="flex flex-wrap gap-2">
									{suggestedSlots.map((slot, idx) => {
										const start = new Date(slot.start);
										const end = new Date(slot.end);
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
												className="border border-blue-200 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-50"
												onClick={() => {
													const pad = (n) => String(n).padStart(2, "0");
													const d = start;
													const dateStr = `${d.getFullYear()}-${pad(
														d.getMonth() + 1
													)}-${pad(d.getDate())}`;
													setStartDate(dateStr);
													setEndDate(dateStr);
													setStartTime(
														`${pad(start.getHours())}:${pad(
															start.getMinutes()
														)}`
													);
													setEndTime(
														`${pad(end.getHours())}:${pad(end.getMinutes())}`
													);
												}}
											>
												{label}
											</button>
										);
									})}
								</div>
							</div>
						)}

						{/* Inputs */}
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="text-xs text-gray-500">Start Date</label>
								<input
									type="date"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
									className="w-full border rounded px-3 py-2"
								/>
							</div>
							<div>
								<label className="text-xs text-gray-500">End Date</label>
								<input
									type="date"
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
									className="w-full border rounded px-3 py-2"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="text-xs text-gray-500">Start Time</label>
								<input
									type="time"
									value={startTime}
									onChange={(e) => setStartTime(e.target.value)}
									className="w-full border rounded px-3 py-2"
								/>
							</div>
							<div>
								<label className="text-xs text-gray-500">End Time</label>
								<input
									type="time"
									value={endTime}
									onChange={(e) => setEndTime(e.target.value)}
									className="w-full border rounded px-3 py-2"
								/>
							</div>
						</div>

						{/* Notes + Price */}
						<div className="grid grid-cols-2 gap-3 mb-5">
							<div>
								<label className="text-xs text-gray-500">Price</label>
								<div className="py-2 font-semibold text-gray-800">
									${totalPrice ? totalPrice.toFixed(2) : "0.00"}
								</div>
							</div>
							<div>
								<label className="text-xs text-gray-500">
									Notes (optional)
								</label>
								<textarea
									rows="2"
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									className="w-full border rounded px-3 py-2"
									placeholder="Any instructions for the host"
								/>
							</div>
						</div>
					</div>

					{/* Footer (pinned at bottom) */}
					<div className="flex justify-end gap-3 p-6 border-t bg-white sticky bottom-0 z-10 rounded-b-2xl">
						<button
							onClick={() => onClose(false)}
							className="px-4 py-2 rounded border hover:bg-gray-50"
							disabled={isLoading}
						>
							Cancel
						</button>
						<button
							onClick={handleBook}
							disabled={isLoading || !isFormValid()}
							className={`px-5 py-2 rounded text-white font-semibold ${
								isFormValid()
									? "bg-blue-600 hover:bg-blue-700"
									: "bg-gray-400 cursor-not-allowed"
							}`}
						>
							{isLoading ? "Booking..." : `Book $${totalPrice.toFixed(2)}`}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default BookingModal;
