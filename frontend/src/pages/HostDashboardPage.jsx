import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import CreateSpotForm from "../components/host/CreateSpotForm";
import MySpotsList from "../components/host/MySpotsList";

/**
 * Host dashboard shows host's spots and bookings / create spot form.
 */
const HostDashboardPage = () => {
	const [spots, setSpots] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showCreate, setShowCreate] = useState(false);

	const fetchSpots = async () => {
		try {
			setLoading(true);
			const { data } = await axios.get("/api/spots/my");
			setSpots(Array.isArray(data) ? data : []);
		} catch (err) {
			console.error(err);
			toast.error("Unable to load your spots");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSpots();
	}, []);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold">Host Dashboard</h2>
				<button
					onClick={() => setShowCreate((s) => !s)}
					className="bg-blue-600 text-white px-3 py-2 rounded"
				>
					{showCreate ? "Close" : "Create Spot"}
				</button>
			</div>

			{showCreate && (
				<CreateSpotForm
					onSaved={() => {
						setShowCreate(false);
						fetchSpots();
					}}
				/>
			)}

			<section>
				<h3 className="font-medium mb-3">My Spots</h3>
				{loading ? (
					<div>Loading your spots...</div>
				) : (
					<MySpotsList spots={spots} onDeleted={fetchSpots} />
				)}
			</section>
		</div>
	);
};

export default HostDashboardPage;
