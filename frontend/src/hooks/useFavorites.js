import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const STORAGE_KEY = "parkingfinder_saved_spots";

/**
 * Custom hook to manage parking spot favorites.
 * Persists to backend database for authenticated users, falling back to localStorage.
 */
export function useFavorites(userInfo) {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync favorites on mount or user session change
  useEffect(() => {
    let isMounted = true;

    const loadFavorites = async () => {
      if (userInfo?._id) {
        try {
          const { data } = await axios.get("/api/auth/favorites", { withCredentials: true });
          const ids = Array.isArray(data)
            ? data.map((item) => (typeof item === "object" && item._id ? item._id : item))
            : [];
          if (isMounted) {
            setFavorites(ids);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
            setIsLoading(false);
          }
          return;
        } catch (e) {
          console.warn("Server favorites fetch fallback:", e.message);
        }
      }

      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        if (isMounted) setFavorites(saved);
      } catch {
        if (isMounted) setFavorites([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadFavorites();

    return () => {
      isMounted = false;
    };
  }, [userInfo]);

  const toggleFavorite = useCallback(
    async (spotId) => {
      const isFav = favorites.includes(spotId);
      let updated;
      if (isFav) {
        updated = favorites.filter((id) => id !== spotId);
        toast("Removed from favorites");
      } else {
        updated = [...favorites, spotId];
        toast.success("Saved to favorites!");
      }

      setFavorites(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Persist to backend if authenticated
      if (userInfo?._id) {
        try {
          if (isFav) {
            await axios.delete(`/api/auth/favorites/${spotId}`, { withCredentials: true });
          } else {
            await axios.post(`/api/auth/favorites/${spotId}`, {}, { withCredentials: true });
          }
        } catch (err) {
          console.warn("Failed to sync favorite with server:", err.message);
        }
      }
    },
    [favorites, userInfo]
  );

  const isFavorite = useCallback((spotId) => favorites.includes(spotId), [favorites]);

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    isLoading,
  };
}

export default useFavorites;

