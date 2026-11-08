import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { uploadImageToCloudinary } from "../../utils/cloudinary";
import toast from "react-hot-toast";

/**
 * ImageUpload Component.
 * Supports selecting multiple images, uploading via Cloudinary or local preview,
 * displaying thumbnails, and removing images.
 */
export default function ImageUpload({ images = [], onChange, maxImages = 5 }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (images.length + files.length > maxImages) {
      toast.error(`You can upload a maximum of ${maxImages} images`);
      return;
    }

    setIsUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        if (!file.type.startsWith("image/")) {
          throw new Error("Only image files are accepted (JPG, PNG, WebP)");
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Each image must be under 5MB");
        }
        return await uploadImageToCloudinary(file);
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onChange([...images, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image${uploadedUrls.length > 1 ? "s" : ""} added`);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = (indexToRemove) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
          <ImageIcon size={14} className="text-[#2563EB]" />
          Space Photos ({images.length}/{maxImages})
        </label>
        <span className="text-[11px] text-[#64748B]">JPG, PNG or WebP up to 5MB</span>
      </div>

      {/* Grid of Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {images.map((url, idx) => (
            <div
              key={idx}
              className="relative group rounded-lg overflow-hidden border border-[#DDE3EA] bg-slate-50 aspect-video flex items-center justify-center"
            >
              <img
                src={url}
                alt={`Parking spot preview ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80";
                }}
              />
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/80 hover:bg-red-600 text-white flex items-center justify-center transition cursor-pointer shadow-xs"
                title="Remove photo"
              >
                <X size={13} />
              </button>
              {idx === 0 && (
                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#2563EB] text-white">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Drop Zone / Button */}
      {images.length < maxImages && (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            id="spot-photos-input"
          />
          <label
            htmlFor="spot-photos-input"
            className={`border border-dashed border-[#CBD5E1] hover:border-[#2563EB] rounded-lg p-4 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 text-center ${
              isUploading ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            {isUploading ? (
              <Loader2 size={18} className="animate-spin text-[#2563EB]" />
            ) : (
              <Upload size={18} className="text-[#64748B]" />
            )}
            <span className="text-xs font-medium text-[#0F172A]">
              {isUploading ? "Processing photos..." : "Click to select and upload photos"}
            </span>
            <span className="text-[10px] text-[#64748B]">
              Add photos of your parking bay, entrance, or access barrier
            </span>
          </label>
        </div>
      )}
    </div>
  );
}

