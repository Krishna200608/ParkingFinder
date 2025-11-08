import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Calendar, Clock, MapPin, CreditCard, Car } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Gradient Header */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-400 text-white py-12 text-center shadow-md">
        <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
        <p className="text-blue-100 text-sm">
          View and manage your parking reservations easily.
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-6 mt-10">
        {loading ? (
          <div className="text-center text-gray-500 py-20 text-lg">
            Loading your bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl shadow text-center text-gray-600">
            <Car size={40} className="mx-auto mb-3 text-blue-500" />
            <h3 className="text-xl font-medium mb-1">No Bookings Yet</h3>
            <p className="text-sm text-gray-500">
              You haven’t made any bookings yet. Find parking nearby and get
              started!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((b) => (
              <div
                key={b._id}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border border-gray-100 p-6 flex flex-col justify-between"
              >
                {/* Header Info */}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                      <MapPin size={16} className="text-blue-500" />
                      {b.spot?.address || "Unknown address"}
                    </h3>
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

                  <p className="text-sm text-gray-500 mb-3">
                    Host: {b.host?.username || "N/A"}
                  </p>

                  {/* Time Info */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <Calendar size={14} className="text-blue-500" />
                      <span>
                        {new Date(b.startTime).toDateString() ===
                        new Date(b.endTime).toDateString()
                          ? new Date(b.startTime).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : `${new Date(b.startTime).toLocaleDateString(
                              "en-IN"
                            )} → ${new Date(b.endTime).toLocaleDateString(
                              "en-IN"
                            )}`}
                      </span>
                    </p>

                    <p className="flex items-center gap-2">
                      <Clock size={14} className="text-blue-500" />
                      <span>
                        {formatTime(b.startTime)} - {formatTime(b.endTime)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t mt-4 mb-3"></div>

                {/* Footer */}
                <div className="flex justify-between items-center text-sm">
                  <div className="text-gray-500 flex items-center gap-1">
                    <CreditCard size={14} className="text-blue-500" />
                    <span>
                      {b.paymentStatus === "paid" ? (
                        <span className="text-green-600 font-medium">
                          Paid
                        </span>
                      ) : (
                        <span className="text-yellow-600 font-medium">
                          Pending
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-gray-600">
                      ₹{b.spot?.pricePerHour || 0}/hr
                    </p>
                    <p className="font-semibold text-blue-600 text-base">
                      ₹{b.totalCost || 0}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => toast("Feature coming soon")}
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
