import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";

/**
 * Props:
 *  - spots: array of spots
 *  - onDeleted(): callback to refresh after deletion
 */
export default function MySpotsList({ spots = [], onDeleted = () => {} }) {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (spot) => {
    if (!confirm("Are you sure you want to delete this parking spot?")) return;
    try {
      setDeletingId(spot._id || spot.id);
      await axios.delete(`/api/spots/${spot._id || spot.id}`);
      toast.success("Parking spot deleted successfully");
      onDeleted();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete parking spot");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {spots.map((s) => (
        <div
          key={s._id || s.id}
          className="border border-[#DDE3EA] rounded-xl p-4 bg-white flex justify-between items-start text-xs"
        >
          <div>
            <h4 className="font-semibold text-sm text-[#0F172A]">{s.title || s.address}</h4>
            <p className="text-[#334155] mt-0.5">{s.description || s.address}</p>
            <div className="text-xs font-bold text-[#2563EB] mt-2">
              ${s.pricePerHour}/hr
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/host/edit-spot/${s._id || s.id}`)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(s)}
              disabled={deletingId === (s._id || s.id)}
            >
              {deletingId === (s._id || s.id) ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
