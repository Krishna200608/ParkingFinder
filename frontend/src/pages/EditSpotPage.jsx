import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import CreateSpotForm from "../components/host/CreateSpotForm";

/**
 * Loads spot by id and reuses CreateSpotForm for editing.
 */
const EditSpotPage = () => {
	const { id } = useParams();
	const [spot, setSpot] = useState(null);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();

	useEffect(() => {
		const fetchSpot = async () => {
			try {
				setLoading(true);
				const { data } = await axios.get(`/api/spots/${id}`);
				setSpot(data);
			} catch (err) {
				console.error(err);
				toast.error("Unable to fetch spot");
			} finally {
				setLoading(false);
			}
		};
		fetchSpot();
	}, [id]);

	return (
		<div>
			<button
				onClick={() => navigate(-1)}
				className="text-sm text-blue-600 mb-4"
			>
				← Back
			</button>
			<h2 className="text-2xl font-semibold mb-4">
				{spot ? "Edit Spot" : "Loading..."}
			</h2>
			{!loading && spot && (
				<CreateSpotForm
					initialData={spot}
					onSaved={() => navigate("/host/dashboard")}
				/>
			)}
		</div>
	);
};

export default EditSpotPage;
