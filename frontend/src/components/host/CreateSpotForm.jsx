import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

/**
 * CreateSpotForm used for basic spot creation/editing.
 * Props:
 *  - initialData (optional): spot object to edit
 *  - onSaved(): callback after successful save
 */
export default function CreateSpotForm({ initialData = null, onSaved = () => {} }) {
  const [address, setAddress] = useState(initialData?.address || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [pricePerHour, setPricePerHour] = useState(initialData?.pricePerHour || 15);
  const [lat, setLat] = useState(initialData?.location?.coordinates?.[1] || "");
  const [lng, setLng] = useState(initialData?.location?.coordinates?.[0] || "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setAddress(initialData.address || "");
      setDescription(initialData.description || "");
      setPricePerHour(initialData.pricePerHour || 15);
      setLat(initialData.location?.coordinates?.[1] || "");
      setLng(initialData.location?.coordinates?.[0] || "");
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address || !lat || !lng) {
      toast.error("Address and coordinates are required");
      return;
    }
    try {
      setIsLoading(true);
      const payload = {
        address,
        description,
        pricePerHour,
        location: {
          type: "Point",
          coordinates: [Number(lng), Number(lat)],
        },
      };

      if (initialData && (initialData._id || initialData.id)) {
        await axios.put(`/api/spots/${initialData._id || initialData.id}`, payload);
        toast.success("Parking spot updated successfully");
      } else {
        await axios.post("/api/spots", payload);
        toast.success("Parking spot created successfully");
      }

      onSaved();
    } catch (err) {
      console.error("Save spot error", err);
      toast.error(err?.response?.data?.message || "Unable to save spot");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 bg-white p-5 rounded-xl border border-[#DDE3EA] text-xs">
      <div>
        <label className="block text-[#475569] font-medium mb-1">Street Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full border border-[#DDE3EA] rounded-lg px-3 py-2 text-xs text-[#17243A] focus:outline-none focus:border-[#2563EB]"
          required
        />
      </div>

      <div>
        <label className="block text-[#475569] font-medium mb-1">Description</label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-[#DDE3EA] rounded-lg p-2 text-xs text-[#17243A] focus:outline-none focus:border-[#2563EB]"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[#475569] font-medium mb-1">Rate ($/hr)</label>
          <input
            type="number"
            step="0.5"
            value={pricePerHour}
            onChange={(e) => setPricePerHour(Number(e.target.value))}
            className="w-full border border-[#DDE3EA] rounded-lg px-3 py-2 text-xs font-semibold text-[#17243A] focus:outline-none focus:border-[#2563EB]"
            required
          />
        </div>
        <div>
          <label className="block text-[#475569] font-medium mb-1">Latitude</label>
          <input
            type="text"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="w-full border border-[#DDE3EA] rounded-lg px-3 py-2 text-xs text-[#17243A] focus:outline-none focus:border-[#2563EB]"
            required
          />
        </div>
        <div>
          <label className="block text-[#475569] font-medium mb-1">Longitude</label>
          <input
            type="text"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="w-full border border-[#DDE3EA] rounded-lg px-3 py-2 text-xs text-[#17243A] focus:outline-none focus:border-[#2563EB]"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 cursor-pointer"
      >
        {isLoading ? "Saving..." : initialData ? "Update Space" : "Create Space"}
      </button>
    </form>
  );
}
