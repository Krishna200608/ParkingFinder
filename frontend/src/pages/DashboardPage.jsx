import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const DashboardPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/bookings/me");
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load your bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const formatTime = (time) =>
    new Date(time).toLocaleString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">My Bookings</h2>

      {loading ? (
        <div className="text-gray-500">Loading your bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center text-gray-600">
          You have not made any bookings yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {bookings.map((b) => (
            <div
              key={b._id}
              className="bg-white p-5 rounded-lg shadow hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">
                    {b.spot?.address || "Unknown address"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Host: {b.host?.username || "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      b.status === "active"
                        ? "bg-green-100 text-green-700"
                        : b.status === "cancelled"
                        ? "bg-red-100 text-red-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Start:</span>{" "}
                  {formatTime(b.startTime)}
                </div>
                <div>
                  <span className="font-medium">End:</span>{" "}
                  {formatTime(b.endTime)}
                </div>
              </div>

              <div className="mt-3 flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-600">
                    ₹{b.spot?.pricePerHour || 0}/hour
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-blue-600">
                    Total ₹{b.totalCost || 0}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-sm">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    b.paymentStatus === "paid"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  Payment: {b.paymentStatus}
                </span>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => toast("Feature coming soon")}
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
