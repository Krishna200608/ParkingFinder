import React from 'react';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { userInfo } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold mb-4">
        Welcome, {userInfo?.username}!
      </h1>
      <p className="text-lg">This is your dashboard. Only logged-in users can see this.</p>
      
      <div className="mt-6 bg-gray-100 p-4 rounded-lg">
        <h3 className="text-xl font-semibold">Your Details:</h3>
        <p><strong>Email:</strong> {userInfo?.email}</p>
        <p><strong>Role:</strong> {userInfo?.role}</p>
      </div>
    </div>
  );
};

export default DashboardPage;
