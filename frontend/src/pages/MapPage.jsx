import React, { useState, useEffect } from 'react';
// ... existing imports ...
import L from 'leaflet';
import toast from 'react-hot-toast';

// --- NEW IMPORT ---
import BookingModal from '../components/booking/BookingModal';

// Fix for default marker icon issue with Leaflet and bundlers
// ... existing icon fix ...
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41] // Half of icon width (25) and full height (41)
});
L.Marker.prototype.options.icon = DefaultIcon;

// ... existing helper components (ChangeView, FlyToLocation) ...
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
  const [selectedSpot, setSelectedSpot] = useState(null); // Spot for Popup
  const [isLoading, setIsLoading] = useState(true);
  
  // --- NEW STATE for Modal ---
  const [bookingSpot, setBookingSpot] = useState(null); // Spot for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ... existing position/zoom state ...
  const [position, setPosition] = useState([40.7128, -74.0060]);
  const [zoom, setZoom] = useState(12);

  // State for user's location to fly to
  const [userLocation, setUserLocation] = useState(null);

  // ... existing useEffect to fetchSpots ...
  useEffect(() => {
    const fetchSpots = async () => {
      try {
        setIsLoading(true);
        const { data } = await axios.get('/api/spots/available');
        setSpots(data);
      } catch (error) {
        toast.error('Could not fetch parking spots');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSpots();
  }, []);

  // ... existing getUserLocation function ...
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPos = [position.coords.latitude, position.coords.longitude];
        setUserLocation(newPos); // Trigger FlyToLocation component
        setZoom(14); // Zoom in closer
      },
      () => {
        toast.error('Unable to retrieve your location');
      }
    );
  };

  // --- NEW FUNCTION to open modal ---
  const handleOpenModal = (spot) => {
    setBookingSpot(spot);
    setIsModalOpen(true);
    setSelectedSpot(null); // Close the popup when modal opens
  };

  // --- NEW FUNCTION to close modal ---
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

      {/* "Find Me" Button */}
      <button
        onClick={getUserLocation}
        className="absolute top-4 left-4 z-[1000] bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg hover:bg-blue-700"
      >
        Find Spots Near Me
      </button>

      <MapContainer 
        center={position} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
      >
        {/* Helper component to fly to user's location when it's set */}
        <FlyToLocation center={userLocation} zoom={14} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Loop through all fetched spots and create a Marker */}
        {spots.map(spot => (
          <Marker
            key={spot._id}
            // Leaflet uses [lat, lng]
            position={[
              spot.location.coordinates[1], 
              spot.location.coordinates[0]
            ]}
            eventHandlers={{
              click: () => {
                setSelectedSpot(spot);
              },
            }}
          >
            {/* --- MODIFIED POPUP --- */}
            <Popup>
              <div className="p-1 w-48">
                <h3 className="font-bold text-lg">{spot.address}</h3>
                <p className="text-sm">{spot.description}</p>
                <p className="text-lg font-semibold mt-2">${spot.pricePerHour}/hr</p>
                <button 
                  onClick={() => handleOpenModal(spot)} // <-- Connect button to modal
                  className="w-full bg-blue-500 text-white text-sm py-1 px-2 rounded mt-2 hover:bg-blue-600"
                >
                  Book Now
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* --- RENDER THE MODAL --- */}
      {isModalOpen && bookingSpot && (
        <BookingModal 
          spot={bookingSpot} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
};

export default MapPage;

