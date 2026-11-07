import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
	MapPin,
	Star,
	Zap,
	ShieldCheck,
	Clock,
	Share2,
	Heart,
	Calendar,
	ArrowLeft,
	Car,
	Info,
	CheckCircle2,
	Navigation,
	User,
	Sparkles,
	MessageSquare,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useAuth } from "../context/AuthContext";
import BookingModal from "../components/booking/BookingModal";

const DefaultIcon = L.icon({
	iconUrl: markerIcon,
	shadowUrl: markerShadow,
	iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const AMENITY_LABELS = {
	covered: { label: "Covered Parking", icon: ShieldCheck },
	ev_charging: { label: "EV Supercharging", icon: Zap },
	cctv: { label: "24/7 CCTV Surveillance", icon: ShieldCheck },
	disabled_access: { label: "Accessible / Disabled Bay", icon: CheckCircle2 },
	valet: { label: "Valet Service", icon: Car },
	gated: { label: "Gated Access Barrier", icon: ShieldCheck },
	lit_lot: { label: "Well-Lit Lot", icon: Sparkles },
};

const SpotDetailsPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const { userInfo } = useAuth();

	const [spot, setSpot] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isFavorite, setIsFavorite] = useState(false);

	// Availability preview state
	const [selectedDate, setSelectedDate] = useState(
		new Date().toISOString().split("T")[0]
	);
	const [availability, setAvailability] = useState(null);
	const [loadingAvailability, setLoadingAvailability] = useState(false);

	// Review submission state
	const [reviewRating, setReviewRating] = useState(5);
	const [reviewComment, setReviewComment] = useState("");
	const [isSubmittingReview, setIsSubmittingReview] = useState(false);

	// Fetch spot details
	const fetchSpotDetails = useCallback(async () => {
		try {
			setIsLoading(true);
			const { data } = await axios.get(`/api/spots/${id}`, {
				withCredentials: true,
			});
			setSpot(data);
		} catch (error) {
			console.error("Failed to load parking spot:", error);
			toast.error("Could not find requested parking spot");
		} finally {
			setIsLoading(false);
		}
	}, [id]);

	// Fetch dynamic slot availability
	const fetchAvailability = useCallback(async (date) => {
		if (!id) return;
		try {
			setLoadingAvailability(true);
			const { data } = await axios.get(
				`/api/bookings/spot/${id}/availability`,
				{
					params: { date },
					withCredentials: true,
				}
			);
			setAvailability(data);
		} catch (err) {
			console.error("Error loading availability preview:", err);
		} finally {
			setLoadingAvailability(false);
		}
	}, [id]);

	useEffect(() => {
		fetchSpotDetails();
	}, [fetchSpotDetails]);

	useEffect(() => {
		if (spot) {
			fetchAvailability(selectedDate);
			// Check saved favorites
			try {
				const saved = JSON.parse(
					localStorage.getItem("parkingfinder_saved_spots") || "[]"
				);
				setIsFavorite(saved.includes(spot._id));
			} catch {
				setIsFavorite(false);
			}
		}
	}, [spot, selectedDate, fetchAvailability]);

	const toggleFavorite = () => {
		if (!spot) return;
		try {
			const saved = JSON.parse(
				localStorage.getItem("parkingfinder_saved_spots") || "[]"
			);
			let updated;
			if (saved.includes(spot._id)) {
				updated = saved.filter((sId) => sId !== spot._id);
				setIsFavorite(false);
				toast("Removed from saved spots");
			} else {
				updated = [...saved, spot._id];
				setIsFavorite(true);
				toast.success("Saved to favorites!");
			}
			localStorage.setItem(
				"parkingfinder_saved_spots",
				JSON.stringify(updated)
			);
		} catch (e) {
			console.error("Failed to update favorites:", e);
		}
	};

	const handleShare = () => {
		navigator.clipboard.writeText(window.location.href);
		toast.success("Spot link copied to clipboard!");
	};

	const handleReviewSubmit = async (e) => {
		e.preventDefault();
		if (!userInfo) {
			toast.error("Please log in to submit a review");
			navigate("/login");
			return;
		}

		try {
			setIsSubmittingReview(true);
			await axios.post(
				`/api/spots/${id}/reviews`,
				{ rating: reviewRating, comment: reviewComment },
				{ withCredentials: true }
			);
			toast.success("Review posted successfully!");
			setReviewComment("");
			fetchSpotDetails();
		} catch (error) {
			const msg =
				error.response?.data?.message || "Failed to submit review";
			toast.error(msg);
		} finally {
			setIsSubmittingReview(false);
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
				<div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
				<p className="text-gray-600 font-medium text-sm">
					Loading parking spot details...
				</p>
			</div>
		);
	}

	if (!spot) {
		return (
			<div className="max-w-2xl mx-auto my-16 text-center bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
				<h2 className="text-2xl font-bold text-gray-800 mb-2">
					Parking Spot Not Found
				</h2>
				<p className="text-gray-500 mb-6 text-sm">
					The parking spot you are looking for may have been removed or is temporarily unavailable.
				</p>
				<Link
					to="/find"
					className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition"
				>
					<ArrowLeft size={16} /> Explore All Parking Spots
				</Link>
			</div>
		);
	}

	const coordinates = spot.location?.coordinates || [77.209, 28.6139];
	const [lng, lat] = coordinates;
	const currentUserId = userInfo?._id || userInfo?.user?._id;
	const isOwner = spot.owner?._id === currentUserId;

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-8">
			{/* Top Navigation & Action Bar */}
			<div className="flex flex-wrap items-center justify-between gap-4">
				<button
					onClick={() => navigate("/find")}
					className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition"
				>
					<ArrowLeft size={18} /> Back to Search Map
				</button>
				<div className="flex items-center gap-2">
					<button
						onClick={toggleFavorite}
						className={`p-2.5 rounded-xl border transition ${
							isFavorite
								? "bg-rose-50 border-rose-200 text-rose-600"
								: "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
						}`}
						title={isFavorite ? "Saved" : "Save spot"}
					>
						<Heart
							size={18}
							className={isFavorite ? "fill-rose-500 text-rose-500" : ""}
						/>
					</button>
					<button
						onClick={handleShare}
						className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition"
					>
						<Share2 size={16} /> Share
					</button>
				</div>
			</div>

			{/* Main Grid: Left Details & Right Booking Card */}
			<div className="grid lg:grid-cols-3 gap-8 items-start">
				{/* Left 2 Columns: Spot Info, Amenities, Mini-Map, Reviews */}
				<div className="lg:col-span-2 space-y-8">
					{/* Header Box */}
					<div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-4">
						<div className="flex flex-wrap items-center gap-2">
							<span
								className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
									spot.spotType === "operator"
										? "bg-purple-100 text-purple-700"
										: "bg-emerald-100 text-emerald-700"
								}`}
							>
								{spot.spotType === "operator"
									? "Commercial Hub"
									: "Peer-to-Peer Space"}
							</span>
							<span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
								Vehicle: {spot.vehicleSize?.toUpperCase() || "ANY"}
							</span>
							{spot.isAvailable ? (
								<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
									<CheckCircle2 size={12} /> Live Available
								</span>
							) : (
								<span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
									Currently Occupied
								</span>
							)}
						</div>

						<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
							{spot.title || spot.address}
						</h1>

						<div className="flex items-center gap-2 text-gray-600 text-sm">
							<MapPin size={18} className="text-blue-600 shrink-0" />
							<span>{spot.address}</span>
						</div>

						<div className="flex items-center gap-4 pt-2 border-t border-gray-100 text-sm">
							<div className="flex items-center gap-1.5 text-amber-500 font-semibold">
								<Star size={18} className="fill-amber-400" />
								<span>{spot.rating ? spot.rating.toFixed(1) : "New"}</span>
								<span className="text-gray-400 font-normal">
									({spot.reviews?.length || 0} reviews)
								</span>
							</div>
							<span className="text-gray-300">|</span>
							<div className="text-gray-500 flex items-center gap-1.5">
								<User size={16} /> Hosted by{" "}
								<span className="font-medium text-gray-800">
									{spot.owner?.username || "Verified Host"}
								</span>
							</div>
						</div>
					</div>

					{/* Description & Overview */}
					<div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-4">
						<h2 className="text-lg font-bold text-gray-900">About This Spot</h2>
						<p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">
							{spot.description ||
								"Convenient and secure parking space located in a prime location. Ideal for daily commuters, business meetings, and visitors."}
						</p>

						{spot.accessInstructions && (
							<div className="mt-4 p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
								<Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
								<div>
									<h4 className="text-sm font-semibold text-blue-900">
										Access & Parking Instructions
									</h4>
									<p className="text-xs text-blue-800 mt-1">
										{spot.accessInstructions}
									</p>
								</div>
							</div>
						)}
					</div>

					{/* Features & Amenities */}
					<div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-4">
						<h2 className="text-lg font-bold text-gray-900">
							Amenities & Features
						</h2>
						{spot.amenities && spot.amenities.length > 0 ? (
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
								{spot.amenities.map((amenityKey) => {
									const meta = AMENITY_LABELS[amenityKey] || {
										label: amenityKey.replace(/_/g, " "),
										icon: CheckCircle2,
									};
									const IconComp = meta.icon;
									return (
										<div
											key={amenityKey}
											className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 text-xs font-medium"
										>
											<IconComp size={16} className="text-blue-600 shrink-0" />
											<span>{meta.label}</span>
										</div>
									);
								})}
							</div>
						) : (
							<p className="text-xs text-gray-500">
								Standard open parking bay with street/driveway access.
							</p>
						)}
					</div>

					{/* Mini Interactive Map */}
					<div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-4">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-bold text-gray-900">Location</h2>
							<a
								href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline"
							>
								<Navigation size={14} /> Get Directions
							</a>
						</div>
						<div className="h-64 w-full rounded-xl overflow-hidden border border-gray-200">
							<MapContainer
								center={[lat, lng]}
								zoom={16}
								style={{ height: "100%", width: "100%" }}
							>
								<TileLayer
									attribution='&copy; <a href="https://openstreetmap.org">OSM</a>'
									url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
								/>
								<Marker position={[lat, lng]}>
									<Popup>
										<div className="text-xs">
											<strong>{spot.title || spot.address}</strong>
											<br />
											${spot.pricePerHour}/hr
										</div>
									</Popup>
								</Marker>
							</MapContainer>
						</div>
					</div>

					{/* Verified Reviews Section */}
					<div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-bold text-gray-900">
								Driver Reviews ({spot.reviews?.length || 0})
							</h2>
							<div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
								<Star size={18} className="fill-amber-400" />
								<span>{spot.rating ? spot.rating.toFixed(1) : "0.0"} / 5.0</span>
							</div>
						</div>

						{spot.reviews && spot.reviews.length > 0 ? (
							<div className="divide-y divide-gray-100 space-y-4">
								{spot.reviews.map((rev, index) => (
									<div key={index} className="pt-4 first:pt-0 space-y-1.5">
										<div className="flex items-center justify-between">
											<span className="text-sm font-semibold text-gray-800">
												{rev.user?.username || "Verified Driver"}
											</span>
											<span className="text-xs text-gray-400">
												{new Date(rev.createdAt).toLocaleDateString()}
											</span>
										</div>
										<div className="flex items-center gap-1 text-amber-400 text-xs">
											{Array.from({ length: 5 }).map((_, i) => (
												<Star
													key={i}
													size={14}
													className={
														i < rev.rating
															? "fill-amber-400 text-amber-400"
															: "text-gray-200"
													}
												/>
											))}
										</div>
										<p className="text-xs text-gray-600">{rev.comment}</p>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-6 text-gray-400 text-xs">
								No reviews yet. Be the first to park and leave feedback!
							</div>
						)}

						{/* Write a Review Form */}
						{userInfo && !isOwner && (
							<form
								onSubmit={handleReviewSubmit}
								className="mt-6 pt-6 border-t border-gray-100 space-y-4"
							>
								<h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
									<MessageSquare size={16} className="text-blue-600" /> Leave a Review
								</h3>
								<div className="flex items-center gap-2">
									<span className="text-xs text-gray-500">Your Rating:</span>
									<div className="flex items-center gap-1">
										{[1, 2, 3, 4, 5].map((star) => (
											<button
												key={star}
												type="button"
												onClick={() => setReviewRating(star)}
												className="p-1 focus:outline-none"
											>
												<Star
													size={18}
													className={
														star <= reviewRating
															? "fill-amber-400 text-amber-400"
															: "text-gray-300"
													}
												/>
											</button>
										))}
									</div>
								</div>
								<textarea
									rows={3}
									value={reviewComment}
									onChange={(e) => setReviewComment(e.target.value)}
									placeholder="Share your parking experience (space access, cleanliness, convenience)..."
									className="w-full text-xs border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
									required
								/>
								<button
									type="submit"
									disabled={isSubmittingReview}
									className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition"
								>
									{isSubmittingReview ? "Posting..." : "Submit Review"}
								</button>
							</form>
						)}
					</div>
				</div>

				{/* Right Column: Sticky Booking Card & Availability Schedule */}
				<div className="lg:sticky lg:top-24 space-y-6">
					<div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 space-y-6">
						<div className="flex items-baseline justify-between border-b border-gray-100 pb-4">
							<div>
								<span className="text-3xl font-extrabold text-blue-600">
									${spot.pricePerHour}
								</span>
								<span className="text-xs text-gray-500 font-medium"> / hour</span>
							</div>
							<div className="text-right">
								<span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
									Instant Reserve
								</span>
							</div>
						</div>

						{/* Demo Notice */}
						<div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
							<div className="font-semibold flex items-center gap-1">
								<Info size={14} className="shrink-0" /> Zero-Cost Demo
							</div>
							<p className="text-[11px] leading-tight">
								Free demonstration reservation system. No credit card required.
							</p>
						</div>

						{/* Real-time Availability Date Selector */}
						<div className="space-y-2">
							<label
								htmlFor="availabilityDate"
								className="block text-xs font-semibold text-gray-700 flex items-center gap-1.5"
							>
								<Calendar size={14} className="text-blue-600" /> Check
								Availability Date:
							</label>
							<input
								id="availabilityDate"
								type="date"
								value={selectedDate}
								min={new Date().toISOString().split("T")[0]}
								onChange={(e) => setSelectedDate(e.target.value)}
								className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>

							{loadingAvailability ? (
								<p className="text-xs text-gray-400 py-1">Checking slots...</p>
							) : availability?.occupiedIntervals?.length > 0 ? (
								<div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 space-y-1">
									<span className="font-medium text-gray-800 block">
										Busy Hours on {selectedDate}:
									</span>
									{availability.occupiedIntervals.map((interval, i) => (
										<div
											key={i}
											className="flex items-center gap-1.5 text-rose-600 text-[11px]"
										>
											<Clock size={12} />
											<span>
												{new Date(interval.start).toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit",
												})}{" "}
												→{" "}
												{new Date(interval.end).toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit",
												})}
											</span>
										</div>
									))}
								</div>
							) : (
								<p className="text-[11px] text-emerald-600 font-medium pt-1">
									✓ Full day free & available for reservation
								</p>
							)}
						</div>

						{/* Booking CTA Button */}
						{isOwner ? (
							<div className="p-3 bg-gray-100 rounded-xl text-center text-xs text-gray-500 font-medium">
								You are the host of this parking space.
							</div>
						) : (
							<button
								onClick={() => setIsModalOpen(true)}
								className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 text-sm"
							>
								<Clock size={16} /> Reserve Parking Space
							</button>
						)}

						<div className="text-center text-[11px] text-gray-400 space-y-1 pt-2">
							<p>• Free cancellation up to scheduled arrival</p>
							<p>• Concurrency protected booking engine</p>
						</div>
					</div>
				</div>
			</div>

			{isModalOpen && (
				<BookingModal
					spot={spot}
					onClose={(success) => {
						setIsModalOpen(false);
						if (success) {
							fetchAvailability(selectedDate);
							fetchSpotDetails();
						}
					}}
				/>
			)}
		</div>
	);
};

export default SpotDetailsPage;

