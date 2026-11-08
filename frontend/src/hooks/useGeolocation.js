import { useState, useCallback } from "react";
import toast from "react-hot-toast";

/**
 * Custom hook to manage GPS user location lookup and status.
 */
export function useGeolocation(defaultPosition = [28.6139, 77.209]) {
  const [position, setPosition] = useState(defaultPosition);
  const [isLocating, setIsLocating] = useState(false);

  const getCurrentLocation = useCallback((onSuccess) => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setPosition(coords);
        setIsLocating(false);
        toast.success("Centered on your current location");
        if (onSuccess) onSuccess(coords);
      },
      (err) => {
        console.warn("Location error:", err);
        setIsLocating(false);
        toast.error("Could not obtain location. Check browser permissions.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  return {
    position,
    setPosition,
    isLocating,
    getCurrentLocation,
  };
}

export default useGeolocation;

