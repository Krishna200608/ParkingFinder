import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // For notifications

// Import Components
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import HostRoute from './components/HostRoute'; // <-- IMPORT NEW HOST ROUTE

// Import Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import HostDashboardPage from './pages/HostDashboardPage'; // <-- IMPORT NEW HOST PAGE
import EditSpotPage from './pages/EditSpotPage'; // <-- IMPORT NEW EDIT PAGE

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Toaster position="top-center" reverseOrder={false} />
      <Header />
      <main className="container mx-auto p-4 flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/find" element={<MapPage />} />
          
          {/* --- Protected 'Driver' Routes --- */}
          <Route path="" element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            {/* Add 'My Bookings' page here later */}
          </Route>

          {/* --- Protected 'Host' Routes --- */}
          <Route path="" element={<HostRoute />}>
            <Route path="/host/dashboard" element={<HostDashboardPage />} />
            <Route path="/host/edit-spot/:id" element={<EditSpotPage />} />
          </Route>

        </Routes>
      </main>
    </div>
  );
}

export default App;