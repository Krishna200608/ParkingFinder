import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
	MapPin,
	DollarSign,
	Clock,
	CheckCircle2,
	PlusCircle,
	Car,
	Star,
	Trash2,
	Edit3,
	ExternalLink,
	Power,
	Calendar,
	Users,
	ShieldCheck,
	Zap,
} from "lucide-react";

const HostDashboardPage = () => {
	const { userInfo } = useAuth();
	const [activeTab, setActiveTab] = useState("listings"); // "listings" | "bookings"
	const [spots, setSpots] = useState([]);
	const [bookings, setBookings] = useState([]);
	const [loading, setLoading] = useState(true);
	const [togglingSpotId, setTogglingSpotId] = useState(null);
	const [deletingSpotId, setDeletingSpotId] = useState(null);

	// Fetch host's parking listings
	const fetchSpots = useCallback(async () => {
		try {
			const { data } = await axios.get("/api/spots/my", {
				withCredentials: true,
			});
			setSpots(Array.isArray(data) ? data : []);
		} catch (error) {
			console.error("Error fetching spots:", error);
			toast.error(error.response?.data?.message || "Failed to load your spots");
		}
	}, []);

	// Fetch driver reservations on host's spots
	const fetchHostBookings = useCallback(async () => {
		try {
			const { data } = await axios.get("/api/bookings/host", {
				withCredentials: true,
			});
			setBookings(Array.isArray(data) ? data : []);
		} catch (error) {
			console.error("Error fetching host bookings:", error);
		}
	}, []);

	// Initial data loading
	useEffect(() => {
		const loadData = async () => {
			setLoading(true);
			await Promise.all([fetchSpots(), fetchHostBookings()]);
			setLoading(false);
		};
		loadData();
	}, [fetchSpots, fetchHostBookings]);

	// Toggle spot active availability
	const handleToggleAvailability = async (spot) => {
		try {
			setTogglingSpotId(spot._id);
			const newStatus = !spot.isAvailable;
			await axios.put(
				`/api/spots/${spot._id}`,
				{ isAvailable: newStatus },
				{ withCredentials: true }
			);
			toast.success(
				newStatus
					? "Spot activated for driver reservations"
					: "Spot paused from public discovery"
			);
			setSpots((prev) =>
				prev.map((s) =>
					s._id === spot._id ? { ...s, isAvailable: newStatus } : s
				)
			);
		} catch (error) {
			console.error("Failed to toggle availability:", error);
			toast.error(
				error.response?.data?.message || "Could not update availability"
			);
		} finally {
			setTogglingSpotId(null);
		}
	};

	// Delete parking spot listing
	const handleDeleteSpot = async (spotId) => {
		if (
			!window.confirm(
				"Are you sure you want to permanently delete this parking space listing?"
			)
		) {
			return;
		}

		try {
			setDeletingSpotId(spotId);
			await axios.delete(`/api/spots/${spotId}`, { withCredentials: true });
			toast.success("Parking space listing removed successfully");
			setSpots((prev) => prev.filter((s) => s._id !== spotId));
		} catch (error) {
			console.error("Failed to delete spot:", error);
			toast.error(
				error.response?.data?.message ||
					"Cannot delete spot with active or upcoming bookings."
			);
		} finally {
			setDeletingSpotId(null);
		}
	};

	if (loading) {
		return (
			<div className="flex flex-col justify-center items-center h-[65vh] text-gray-600 space-y-3">
				<div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
				<p className="text-sm font-medium">Loading your Host Marketplace portal...</p>
			</div>
		);
	}

	const totalEarnings = spots.reduce(
		(sum, s) => sum + (s.totalEarnings || 0),
		0
	);
	const totalBookingsCount = spots.reduce(
		(sum, s) => sum + (s.totalBookings || 0),
		0
	);
	const activeSpacesCount = spots.filter((s) => s.isAvailable).length;
	const ratedSpots = spots.filter((s) => s.rating > 0);
	const avgRating =
		ratedSpots.length > 0
			? ratedSpots.reduce((acc, s) => acc + s.rating, 0) / ratedSpots.length
			: null;

	return (
		<div className="min-h-screen bg-gray-50 pb-20 space-y-8">
			{/* Banner / Analytics Hero */}
			<section className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white py-12 px-6 rounded-2xl shadow-lg">
				<div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
					<div>
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-semibold uppercase tracking-wider mb-2">
							<ShieldCheck size={14} /> Host Partner Portal
						</div>
						<h1 className="text-2xl sm:text-3xl font-extrabold">
							Welcome, {userInfo?.username || "Partner Host"} 👋
						</h1>
						<p className="text-blue-100 text-xs sm:text-sm mt-1">
							Manage your listed parking spaces, view driver reservations, and monitor revenue performance.
						</p>
					</div>

					{/* 4-Stat Metric Strip */}
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
						<div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 text-center">
							<p className="text-xl sm:text-2xl font-black">${totalEarnings.toFixed(2)}</p>
							<p className="text-blue-200 text-xs font-medium mt-0.5">Gross Revenue</p>
						</div>
						<div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 text-center">
							<p className="text-xl sm:text-2xl font-black">{totalBookingsCount}</p>
							<p className="text-blue-200 text-xs font-medium mt-0.5">Reservations</p>
						</div>
						<div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 text-center">
							<p className="text-xl sm:text-2xl font-black">{activeSpacesCount} / {spots.length}</p>
							<p className="text-blue-200 text-xs font-medium mt-0.5">Active Spaces</p>
						</div>
						<div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 text-center">
							<p className="text-xl sm:text-2xl font-black flex items-center justify-center gap-1">
								<Star size={18} className="fill-amber-300 text-amber-300" />
								{avgRating ? avgRating.toFixed(1) : "New"}
							</p>
							<p className="text-blue-200 text-xs font-medium mt-0.5">Avg Rating</p>
						</div>
					</div>
				</div>
			</section>

			{/* Floating Add Spot Action */}
			<Link
				to="/host/add-spot"
				className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 text-sm font-bold transition hover:scale-105"
			>
				<PlusCircle size={18} />
				List New Space
			</Link>

			{/* Tab Switcher & Header */}
			<div className="max-w-6xl mx-auto px-4 sm:px-6">
				<div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-3">
					<div className="flex items-center gap-3">
						<button
							onClick={() => setActiveTab("listings")}
							className={`pb-2 text-sm font-bold flex items-center gap-2 transition border-b-2 ${
								activeTab === "listings"
									? "border-blue-600 text-blue-600"
									: "border-transparent text-gray-500 hover:text-gray-800"
							}`}
						>
							<Car size={16} /> My Parking Listings ({spots.length})
						</button>
						<button
							onClick={() => setActiveTab("bookings")}
							className={`pb-2 text-sm font-bold flex items-center gap-2 transition border-b-2 ${
								activeTab === "bookings"
									? "border-blue-600 text-blue-600"
									: "border-transparent text-gray-500 hover:text-gray-800"
							}`}
						>
							<Calendar size={16} /> Driver Reservations ({bookings.length})
						</button>
					</div>

					<Link
						to="/host/add-spot"
						className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
					>
						<PlusCircle size={15} /> Add Another Spot
					</Link>
				</div>

				{/* TAB 1: LISTINGS MANAGEMENT */}
				{activeTab === "listings" && (
					<div className="mt-6">
						{spots.length === 0 ? (
							<div className="bg-white shadow-sm rounded-2xl p-12 text-center text-gray-600 border border-gray-100 max-w-lg mx-auto">
								<Car className="mx-auto mb-4 text-blue-500" size={44} />
								<h3 className="text-lg font-bold text-gray-800">
									No parking listings yet
								</h3>
								<p className="text-xs text-gray-500 mt-1 mb-6">
									Turn your driveway, garage, or commercial lot into recurring revenue by listing your first parking space today.
								</p>
								<Link
									to="/host/add-spot"
									className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 text-xs shadow transition"
								>
									<PlusCircle size={16} /> List Your First Spot
								</Link>
							</div>
						) : (
							<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
								{spots.map((spot) => (
									<div
										key={spot._id}
										className="bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 p-5 flex flex-col justify-between space-y-4"
									>
										{/* Top Specs */}
										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<span
													className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
														spot.spotType === "operator"
															? "bg-purple-100 text-purple-700"
															: "bg-emerald-100 text-emerald-700"
													}`}
												>
													{spot.spotType === "operator" ? "Commercial Hub" : "P2P Spot"}
												</span>
												<div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
													<Star size={13} className="fill-amber-400" />
													<span>{spot.rating ? spot.rating.toFixed(1) : "New"}</span>
												</div>
											</div>

											<h3 className="font-bold text-gray-900 text-base line-clamp-1">
												{spot.title || spot.address}
											</h3>
											<p className="text-xs text-gray-500 line-clamp-2 flex items-start gap-1">
												<MapPin size={14} className="text-blue-600 shrink-0 mt-0.5" />
												<span>{spot.address}</span>
											</p>

											{/* Amenity Badges */}
											<div className="flex flex-wrap items-center gap-1 pt-1 text-[10px]">
												{spot.vehicleSize && spot.vehicleSize !== "any" && (
													<span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
														{spot.vehicleSize.toUpperCase()}
													</span>
												)}
												{spot.amenities?.includes("covered") && (
													<span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded flex items-center gap-0.5">
														<ShieldCheck size={10} /> Covered
													</span>
												)}
												{spot.amenities?.includes("ev_charging") && (
													<span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded flex items-center gap-0.5">
														<Zap size={10} /> EV
													</span>
												)}
											</div>
										</div>

										{/* Performance Stats */}
										<div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 grid grid-cols-3 gap-2 text-center text-xs">
											<div>
												<p className="text-gray-400 text-[10px]">Rate</p>
												<p className="font-bold text-gray-800">${spot.pricePerHour}/hr</p>
											</div>
											<div>
												<p className="text-gray-400 text-[10px]">Bookings</p>
												<p className="font-bold text-gray-800">{spot.totalBookings || 0}</p>
											</div>
											<div>
												<p className="text-gray-400 text-[10px]">Earnings</p>
												<p className="font-bold text-emerald-600">${spot.totalEarnings?.toFixed(2) || "0.00"}</p>
											</div>
										</div>

										{/* Status Toggle & Action Controls */}
										<div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
											{/* Availability Quick Toggle */}
											<button
												onClick={() => handleToggleAvailability(spot)}
												disabled={togglingSpotId === spot._id}
												className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
													spot.isAvailable
														? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
														: "bg-gray-100 text-gray-500 hover:bg-gray-200"
												}`}
												title={spot.isAvailable ? "Click to pause listing" : "Click to activate listing"}
											>
												<Power size={13} />
												{togglingSpotId === spot._id
													? "Updating..."
													: spot.isAvailable
													? "Active"
													: "Paused"}
											</button>

											<div className="flex items-center gap-2">
												<Link
													to={`/spots/${spot._id}`}
													className="p-1.5 text-gray-400 hover:text-blue-600 transition"
													title="View public listing page"
												>
													<ExternalLink size={16} />
												</Link>
												<Link
													to={`/host/edit-spot/${spot._id}`}
													className="p-1.5 text-gray-400 hover:text-blue-600 transition"
													title="Edit listing details"
												>
													<Edit3 size={16} />
												</Link>
												<button
													onClick={() => handleDeleteSpot(spot._id)}
													disabled={deletingSpotId === spot._id}
													className="p-1.5 text-gray-400 hover:text-rose-600 transition"
													title="Delete listing"
												>
													<Trash2 size={16} />
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* TAB 2: INCOMING DRIVER RESERVATIONS */}
				{activeTab === "bookings" && (
					<div className="mt-6">
						{bookings.length === 0 ? (
							<div className="bg-white shadow-sm rounded-2xl p-12 text-center text-gray-600 border border-gray-100 max-w-lg mx-auto">
								<Users className="mx-auto mb-4 text-blue-500" size={40} />
								<h3 className="text-lg font-bold text-gray-800">
									No incoming reservations yet
								</h3>
								<p className="text-xs text-gray-500 mt-1">
									When drivers book any of your active parking spaces, their reservations and schedules will appear here in real time.
								</p>
							</div>
						) : (
							<div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
								<div className="overflow-x-auto">
									<table className="w-full text-left text-xs">
										<thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
											<tr>
												<th className="px-5 py-3.5">Parking Space</th>
												<th className="px-5 py-3.5">Driver</th>
												<th className="px-5 py-3.5">Schedule</th>
												<th className="px-5 py-3.5">Revenue</th>
												<th className="px-5 py-3.5">Payment</th>
												<th className="px-5 py-3.5">Status</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-gray-100 text-gray-700">
											{bookings.map((b) => (
												<tr key={b._id} className="hover:bg-gray-50/50 transition">
													<td className="px-5 py-4">
														<div className="font-semibold text-gray-900">
															{b.spot?.title || b.spot?.address || "Parking Spot"}
														</div>
														<div className="text-[11px] text-gray-400 truncate max-w-xs">
															{b.spot?.address}
														</div>
													</td>
													<td className="px-5 py-4">
														<div className="font-semibold text-gray-800">
															{b.user?.username || "Driver"}
														</div>
														<div className="text-[11px] text-gray-400">
															{b.user?.email}
														</div>
													</td>
													<td className="px-5 py-4 whitespace-nowrap">
														<div className="flex items-center gap-1.5 font-medium text-gray-800">
															<Clock size={12} className="text-blue-600" />
															<span>
																{new Date(b.startTime).toLocaleDateString([], {
																	month: "short",
																	day: "numeric",
																})}{" "}
																{new Date(b.startTime).toLocaleTimeString([], {
																	hour: "2-digit",
																	minute: "2-digit",
																})}
															</span>
														</div>
														<div className="text-[11px] text-gray-400 mt-0.5">
															until{" "}
															{new Date(b.endTime).toLocaleTimeString([], {
																hour: "2-digit",
																minute: "2-digit",
															})}
														</div>
													</td>
													<td className="px-5 py-4 font-bold text-emerald-600">
														${(b.totalAmount || b.totalCost || 0).toFixed(2)}
													</td>
													<td className="px-5 py-4">
														<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
															{b.paymentStatus === "unpaid_demo" ? "Demo Booking" : b.paymentStatus}
														</span>
													</td>
													<td className="px-5 py-4">
														<span
															className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
																b.status === "confirmed"
																	? "bg-green-100 text-green-700"
																	: b.status === "active"
																	? "bg-blue-100 text-blue-700"
																	: b.status === "completed"
																	? "bg-gray-100 text-gray-700"
																	: "bg-rose-100 text-rose-700"
															}`}
														>
															{b.status}
														</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default HostDashboardPage;
