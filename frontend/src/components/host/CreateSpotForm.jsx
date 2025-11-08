import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Input from "../form/Input";
import Button from "../form/Button";

/**
 * CreateSpotForm used for both creating and editing.
 * Props:
 *  - initialData (optional): spot object to edit
 *  - onSaved(): callback after successful save
 */
const CreateSpotForm = ({ initialData = null, onSaved = () => {} }) => {
  const [address, setAddress] = useState(initialData?.address || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [pricePerHour, setPricePerHour] = useState(initialData?.pricePerHour || 50);
  const [lat, setLat] = useState(initialData?.location?.coordinates?.[1] || "");
  const [lng, setLng] = useState(initialData?.location?.coordinates?.[0] || "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setAddress(initialData.address || "");
      setDescription(initialData.description || "");
      setPricePerHour(initialData.pricePerHour || 50);
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
        toast.success("Spot updated");
      } else {
        await axios.post("/api/spots", payload);
        toast.success("Spot created");
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
    <form onSubmit={handleSubmit} className="space-y-3 bg-white p-4 rounded">
      <div>
        <label className="text-sm text-gray-600">Address</label>
        <Input value={address} onChange={(e) => setAddress(e.target.value)} required />
      </div>

      <div>
        <label className="text-sm text-gray-600">Description</label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-600">Price / hour (USD)</label>
          <Input
            type="number"
            value={pricePerHour}
            onChange={(e) => setPricePerHour(Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Latitude</label>
          <Input value={lat} onChange={(e) => setLat(e.target.value)} required />
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-600">Longitude</label>
        <Input value={lng} onChange={(e) => setLng(e.target.value)} required />
      </div>

      <Button isLoading={isLoading}>{initialData ? "Update Spot" : "Create Spot"}</Button>
    </form>
  );
};

export default CreateSpotForm;
