import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const HostDashboardPage = () => {
	const { userInfo } = useAuth();
	const [spots, setSpots] = useState([]);
	const [loading, setLoading] = useState(true);

	const fetchSpots = async () => {
		try {
			const config = {
				withCredentials: true, // ✅ Important for cookie-based JWT
				headers: {},
			};

			// Optional Bearer if your backend supports both
			if (userInfo?.token) {
				config.headers.Authorization = `Bearer ${userInfo.token}`;
			}

			const { data } = await axios.get("/api/spots/my", config);
			setSpots(data);
		} catch (error) {
			console.error("Error fetching spots:", error);
			toast.error(error.response?.data?.message || "Failed to load your spots");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSpots();
	}, []);

	if (loading) return <div className="p-6">Loading...</div>;

	return (
		<div className="p-6">
			<h2 className="text-xl font-semibold mb-4">My Parking Spots</h2>
			<Link
				to="/host/add-spot"
				className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
			>
				+ Add Spot
			</Link>
			{spots.length === 0 ? (
				<p>No parking spots found.</p>
			) : (
				<ul className="space-y-3">
					{spots.map((spot) => (
						<li
							key={spot._id}
							className="border p-3 rounded flex flex-col sm:flex-row sm:justify-between sm:items-center"
						>
							<div>
								<p className="font-medium">{spot.address}</p>
								<p className="text-sm text-gray-500">{spot.spotType}</p>
								<p className="text-sm text-gray-400">
									{spot.totalBookings || 0} bookings
								</p>
							</div>
							<div className="text-right mt-2 sm:mt-0">
								<p className="font-semibold text-green-700">
									${spot.totalEarnings?.toFixed(2) || "0.00"} earned
								</p>
								<p className="text-sm text-gray-500">
									Rate: ${spot.pricePerHour}/hr
								</p>
								<p
									className={`text-sm ${
										spot.isAvailable ? "text-green-600" : "text-red-500"
									}`}
								>
									{spot.isAvailable ? "Available" : "Unavailable"}
								</p>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

export default HostDashboardPage;
