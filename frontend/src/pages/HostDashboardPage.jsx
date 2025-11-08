import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  PlusCircle,
  Car,
} from "lucide-react";

const HostDashboardPage = () => {
  const { userInfo } = useAuth();
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSpots = async () => {
    try {
      const config = {
        withCredentials: true,
        headers: {},
      };

      if (userInfo?.token) {
        config.headers.Authorization = `Bearer ${userInfo.token}`;
      }

      const { data } = await axios.get("/api/spots/my", config);
      setSpots(data);
    } catch (error) {
      console.error("Error fetching spots:", error);
      toast.error(error.response?.data?.message || "Failed to load your spots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpots();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[70vh] text-gray-600">
        Loading your dashboard...
      </div>
    );

  const totalEarnings = spots.reduce(
    (sum, s) => sum + (s.totalEarnings || 0),
    0
  );
  const totalBookings = spots.reduce(
    (sum, s) => sum + (s.totalBookings || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Banner Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-400 text-white py-12 px-6 shadow">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome, {userInfo?.username || "Host"} 👋
            </h1>
            <p className="text-blue-100">
              Manage your parking spots and track your performance.
            </p>
          </div>
          <div className="flex gap-8 mt-6 md:mt-0">
            <div className="text-center">
              <p className="text-2xl font-semibold">${totalEarnings.toFixed(2)}</p>
              <p className="text-blue-100 text-sm">Total Earnings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold">{totalBookings}</p>
              <p className="text-blue-100 text-sm">Total Bookings</p>
            </div>
          </div>
        </div>
      </section>

      {/* Add Spot Floating Button */}
      <Link
        to="/host/add-spot"
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-blue-700 flex items-center gap-2 transition"
      >
        <PlusCircle size={18} />
        Add Spot
      </Link>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 mt-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          My Parking Spots
        </h2>

        {spots.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-10 text-center text-gray-600">
            <Car className="mx-auto mb-4 text-blue-500" size={36} />
            <p>No parking spots found. Start by adding your first one!</p>
            <Link
              to="/host/add-spot"
              className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              + Add Spot
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {spots.map((spot) => (
              <div
                key={spot._id}
                className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition border border-gray-100 flex flex-col justify-between"
              >
                {/* Spot Header */}
                <div className="mb-3">
                  <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                    <MapPin className="text-blue-600" size={18} />
                    {spot.address}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 capitalize">
                    {spot.spotType === "p2p" ? "Peer-to-Peer" : "Operator Spot"}
                  </p>
                </div>

                {/* Spot Stats */}
                <div className="space-y-1 text-sm">
                  <p className="flex justify-between text-gray-700">
                    <span className="flex items-center gap-2">
                      <DollarSign size={16} className="text-green-500" />
                      Hourly Rate:
                    </span>
                    <span className="font-medium">${spot.pricePerHour}/hr</span>
                  </p>
                  <p className="flex justify-between text-gray-700">
                    <span className="flex items-center gap-2">
                      <Clock size={16} className="text-blue-500" />
                      Bookings:
                    </span>
                    <span>{spot.totalBookings || 0}</span>
                  </p>
                  <p className="flex justify-between text-gray-700">
                    <span className="flex items-center gap-2">
                      <DollarSign size={16} className="text-yellow-500" />
                      Earnings:
                    </span>
                    <span className="font-semibold text-green-700">
                      ${spot.totalEarnings?.toFixed(2) || "0.00"}
                    </span>
                  </p>
                  <p className="flex justify-between text-gray-700">
                    <span className="flex items-center gap-2">
                      {spot.isAvailable ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <XCircle size={16} className="text-red-500" />
                      )}
                      Status:
                    </span>
                    <span
                      className={`font-medium ${
                        spot.isAvailable ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {spot.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-4 flex justify-end">
                  <Link
                    to={`/host/edit-spot/${spot._id}`}
                    className="text-sm text-blue-600 font-medium hover:underline"
                  >
                    Edit Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HostDashboardPage;
