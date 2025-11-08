import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import toast from "react-hot-toast";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import BookingModal from "../components/booking/BookingModal";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function FlyToHelper({ mapRef, target }) {
  const map = useMap();
  useEffect(() => {
    if (target && map) {
      map.flyTo(target, 16, { duration: 1.2 });
    }
  }, [target, map]);
  return null;
}

const MapPage = () => {
  const [spots, setSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingSpot, setBookingSpot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [position, setPosition] = useState([28.6139, 77.209]);
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef();

  // ✅ keep refs for all markers
  const markerRefs = useRef({});

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get("/api/spots/available");
      setSpots(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch spots:", err);
      toast.error("Unable to load spots");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (spot) => {
    setBookingSpot(spot);
    setIsModalOpen(true);
  };

  const handleCloseModal = (success) => {
    setIsModalOpen(false);
    setBookingSpot(null);
    if (success) fetchSpots();
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not available");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setPosition(coords);
        toast.success("Centered to your location");
      },
      (err) => toast.error("Unable to fetch location")
    );
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Map column */}
      <div className="md:col-span-2">
        <div className="relative h-[72vh] rounded-lg overflow-hidden shadow">
          {isLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
              <div className="text-white text-lg">Loading map & spots...</div>
            </div>
          )}

          <button
            onClick={getUserLocation}
            className="absolute top-4 left-4 z-40 bg-white px-3 py-2 rounded shadow text-sm"
          >
            Find Spots Near Me
          </button>

          <MapContainer
            center={position}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
          >
            <TileLayer
              attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FlyToHelper mapRef={mapRef} target={position} />

            {spots.map((spot) => {
              const lat = spot.location.coordinates[1];
              const lng = spot.location.coordinates[0];

              return (
                <Marker
                  key={spot._id || spot.id}
                  ref={(ref) => (markerRefs.current[spot._id] = ref)}
                  position={[lat, lng]}
                  eventHandlers={{
                    click: () => setSelectedSpot(spot),
                  }}
                >
                  {/* ✅ Popup auto-opens when selected */}
                  {selectedSpot?._id === spot._id && (
                    <Popup autoClose={false} autoPan={true}>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm">
                          {spot.address || spot.name}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {spot.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-semibold">
                            ${spot.pricePerHour}/hr
                          </span>
                          <button
                            onClick={() => handleOpenModal(spot)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Book
                          </button>
                        </div>
                      </div>
                    </Popup>
                  )}
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Side list */}
      <aside className="bg-white rounded-lg p-4 shadow h-[72vh] overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Available Spots</h4>
          <button
            onClick={fetchSpots}
            className="text-sm bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
          >
            Refresh
          </button>
        </div>

        {!spots.length && !isLoading ? (
          <div className="text-sm text-gray-500 mt-6">
            No spots available right now.
          </div>
        ) : (
          <ul className="space-y-3">
            {spots.map((spot) => {
              const lat = spot.location.coordinates[1];
              const lng = spot.location.coordinates[0];

              return (
                <li
                  key={spot._id || spot.id}
                  className="border rounded p-3 hover:shadow cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium text-sm">
                        {spot.address || spot.name}
                      </h5>
                      <p className="text-xs text-gray-500">
                        {spot.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        ${spot.pricePerHour}/hr
                      </div>
                      <div className="text-xs text-gray-500">
                        {spot.distance ? `${spot.distance} km` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(spot);
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Book
                    </button>

                    {/* ✅ Navigate and open popup */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const target = [lat, lng];
                        setPosition(target);
                        setSelectedSpot(spot);
                        if (mapRef.current) {
                          mapRef.current.flyTo(target, 16, { duration: 1.2 });
                        }
                        // Open popup manually
                        const ref = markerRefs.current[spot._id];
                        if (ref) {
                          ref.openPopup();
                        }
                      }}
                      className="border border-gray-200 px-3 py-1 rounded text-sm"
                    >
                      Navigate
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {isModalOpen && bookingSpot && (
        <BookingModal spot={bookingSpot} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default MapPage;
