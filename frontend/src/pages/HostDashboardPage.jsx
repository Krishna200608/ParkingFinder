import React from 'react';
import CreateSpotForm from '../components/host/CreateSpotForm';
import MySpotsList from '../components/host/MySpotsList';

// This page is the main hub for hosts.
// It will be protected by our new <HostRoute>
const HostDashboardPage = () => {
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800">Host Dashboard</h1>
        <p className="text-lg text-gray-600 mt-2">
          Manage your spots and create new listings.
        </p>
      </div>

      {/* Section 1: Create a New Spot */}
      <section className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-semibold mb-6 text-gray-700">List a New Spot</h2>
        <CreateSpotForm />
      </section>

      {/* Section 2: View My Spots */}
      <section className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-semibold mb-6 text-gray-700">My Listed Spots</h2>
        <MySpotsList />
      </section>
    </div>
  );
};

export default HostDashboardPage;