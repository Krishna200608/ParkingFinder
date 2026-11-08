import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const SPOTS_PER_PAGE = 20;

/**
 * Custom hook managing parking spot querying, multi-criteria filtering, and pagination.
 */
export function useSpotSearch({
  position,
  radiusKm,
  maxPrice,
  spotType,
  vehicleSize,
  selectedAmenities,
  searchQuery,
  sortBy,
  showFavoritesOnly,
  favorites = [],
}) {
  const [spots, setSpots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchSpots = useCallback(
    async (page = 1) => {
      if (!position) return;
      try {
        setIsLoading(true);
        const radiusMeters = radiusKm * 1000;

        const params = {
          lat: position[0],
          lng: position[1],
          radius: radiusMeters,
          maxPrice: maxPrice < 50 ? maxPrice : undefined,
          spotType: spotType !== "all" ? spotType : undefined,
          vehicleSize: vehicleSize !== "any" ? vehicleSize : undefined,
          amenities: selectedAmenities.length > 0 ? selectedAmenities.join(",") : undefined,
          search: searchQuery.trim() || undefined,
          sort: sortBy,
          page,
          limit: SPOTS_PER_PAGE,
        };

        const { data } = await axios.get("/api/spots", {
          params,
          withCredentials: true,
        });

        const rawSpots = data?.spots ?? (Array.isArray(data) ? data : []);
        setPagination(data?.pagination ?? null);

        let filtered = rawSpots;
        if (showFavoritesOnly) {
          filtered = filtered.filter((s) => favorites.includes(s._id));
        }

        setSpots(filtered);
        setCurrentPage(page);
      } catch (err) {
        console.error("Failed to fetch spots:", err);
        toast.error("Unable to load spots");
      } finally {
        setIsLoading(false);
      }
    },
    [
      position,
      radiusKm,
      maxPrice,
      spotType,
      vehicleSize,
      selectedAmenities,
      searchQuery,
      sortBy,
      showFavoritesOnly,
      favorites,
    ]
  );

  useEffect(() => {
    fetchSpots(1);
  }, [fetchSpots]);

  return {
    spots,
    isLoading,
    currentPage,
    pagination,
    fetchSpots,
    spotsPerPage: SPOTS_PER_PAGE,
  };
}

export default useSpotSearch;

