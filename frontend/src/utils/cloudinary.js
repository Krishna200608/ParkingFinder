/**
 * Cloudinary Direct Upload Utility.
 * Supports direct unsigned uploads to Cloudinary free tier.
 * If credentials are not present in the environment (e.g. local dev / demo),
 * it gracefully falls back to local data URLs so hosts can test uploads with real previews.
 */
export const uploadImageToCloudinary = async (file) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "parkingfinder_unsigned";

  if (cloudName && uploadPreset) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Cloudinary upload failed with status ${res.status}`);
      }

      const data = await res.json();
      return data.secure_url || data.url;
    } catch (err) {
      console.warn("Cloudinary upload failed, falling back to local data URL:", err.message);
    }
  }

  // Fallback to local Data URL for seamless offline and credential-free operation
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

