import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="space-y-8">
      <section className="rounded-lg bg-gradient-to-r from-blue-50 to-white p-8 shadow-md">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Find parking faster. Drive happier.
            </h2>
            <p className="text-gray-600 mb-6">
              Parking Finder reduces time spent searching for parking by connecting drivers to available spots in real-time —
              private, managed and municipal. Book, navigate and pay — all in one place.
            </p>
            <div className="flex gap-3">
              <Link
                to="/find"
                className="bg-blue-600 text-white px-5 py-3 rounded-md shadow hover:bg-blue-700 transition"
              >
                Find Parking
              </Link>
              <Link
                to="/register"
                className="border border-blue-600 text-blue-600 px-5 py-3 rounded-md hover:bg-blue-50 transition"
              >
                Become a Host
              </Link>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <img
              src="/src/assets/logo.svg"
              alt="parking illustration"
              className="w-full h-56 object-contain"
            />
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="font-semibold mb-2">Real-time Availability</h3>
          <p className="text-sm text-gray-600">See live spots and reserve immediately.</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="font-semibold mb-2">Timestamp Pricing</h3>
          <p className="text-sm text-gray-600">Fair, dynamic pricing without expensive hardware.</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="font-semibold mb-2">Peer-to-Peer Marketplace</h3>
          <p className="text-sm text-gray-600">List unused private spots and earn.</p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
