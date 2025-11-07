import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

// This component fetches and displays spots owned by the logged-in host
const MySpotsList = () => {
  const [spots, setSpots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userInfo } = useAuth();

  useEffect(() => {
    const fetchMySpots = async () => {
      if (!userInfo) return;

      setIsLoading(true);
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        // Call the new 'my-spots' endpoint we built in the backend
        const { data } = await axios.get('/api/spots/my-spots', config);
        setSpots(data);
      } catch (error) {
        toast.error('Could not fetch your spots.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMySpots();
  }, [userInfo]); // Re-fetch if user info changes

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this spot?')) {
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      await axios.delete(`/api/spots/${id}`, config);
      toast.success('Spot deleted successfully.');
      // Refresh the list by filtering out the deleted spot
      setSpots(spots.filter(spot => spot._id !== id));
    } catch (error) {
      toast.error('Failed to delete spot.');
    }
  };

  if (isLoading) {
    return <p>Loading your spots...</p>;
  }

  if (spots.length === 0) {
    return <p>You have not listed any spots yet.</p>;
  }

  return (
    <div className="space-y-4">
      {spots.map(spot => (
        <div key={spot._id} className="p-4 border rounded-lg shadow-sm flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">{spot.address}</h3>
            <p className="text-gray-600">{spot.description}</p>
            <p className="text-lg font-bold">${spot.pricePerHour}/hr</p>
          </div>
          <div className="flex space-x-2">
            <Link 
              to={`/host/edit-spot/${spot._id}`}
              className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600"
            >
              Edit
            </Link>
            <button
              onClick={() => handleDelete(spot._id)}
              className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MySpotsList;