import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

/**
 * Props:
 *  - spots: array of spots
 *  - onDeleted(): callback to refresh after deletion
 */
const MySpotsList = ({ spots = [], onDeleted = () => {} }) => {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (spot) => {
    if (!confirm("Delete this spot? This cannot be undone.")) return;
    try {
      setDeletingId(spot._id || spot.id);
      await axios.delete(`/api/spots/${spot._id || spot.id}`);
      toast.success("Deleted");
      onDeleted();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {spots.map((s) => (
        <div key={s._id || s.id} className="border rounded p-3 flex justify-between items-start">
          <div>
            <h4 className="font-medium">{s.address}</h4>
            <p className="text-xs text-gray-500">{s.description}</p>
            <div className="text-sm mt-2">${s.pricePerHour}/hr</div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate(`/host/edit-spot/${s._id || s.id}`)}
              className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(s)}
              className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              disabled={deletingId === (s._id || s.id)}
            >
              {deletingId === (s._id || s.id) ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MySpotsList;
