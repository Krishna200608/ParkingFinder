import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import BookingModal from '../components/booking/BookingModal';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const FlyToLocation = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

const MapPage = () => {
  const [spots, setSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingSpot, setBookingSpot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [position, setPosition] = useState([40.7128, -74.0060]);
  const [zoom, setZoom] = useState(12);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    const fetchSpots = async () => {
      try {
        setIsLoading(true);
        const { data } = await axios.get('/api/spots/available');
        setSpots(data);
      } catch {
        toast.error('Could not fetch parking spots');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSpots();
  }, []);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const newPos = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(newPos);
        setZoom(14);
      },
      () => toast.error('Unable to retrieve location')
    );
  };

  const handleOpenModal = (spot) => {
    setBookingSpot(spot);
    setIsModalOpen(true);
    setSelectedSpot(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setBookingSpot(null);
  };

  return (
    <div className="relative w-full h-[75vh] rounded-lg shadow-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1001]">
          <span className="text-white text-xl">Loading Map...</span>
        </div>
      )}

      <button
        onClick={getUserLocation}
        className="absolute top-4 left-4 z-[1000] bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg hover:bg-blue-700"
      >
        Find Spots Near Me
      </button>

      <MapContainer center={position} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <FlyToLocation center={userLocation} zoom={14} />

        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {spots.map(spot => (
          <Marker
            key={spot._id}
            position={[spot.location.coordinates[1], spot.location.coordinates[0]]}
            eventHandlers={{ click: () => setSelectedSpot(spot) }}
          >
            <Popup>
              <div className="p-1 w-48">
                <h3 className="font-bold text-lg">{spot.address}</h3>
                <p className="text-sm">{spot.description}</p>
                <p className="text-lg font-semibold mt-2">${spot.pricePerHour}/hr</p>
                <button
                  onClick={() => handleOpenModal(spot)}
                  className="w-full bg-blue-500 text-white text-sm py-1 px-2 rounded mt-2 hover:bg-blue-600"
                >
                  Book Now
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {isModalOpen && bookingSpot && (
        <BookingModal spot={bookingSpot} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default MapPage;