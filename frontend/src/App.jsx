import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import HostRoute from "./components/HostRoute";
import ErrorBoundary from "./components/ErrorBoundary";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import MapPage from "./pages/MapPage";
import HostDashboardPage from "./pages/HostDashboardPage";
import EditSpotPage from "./pages/EditSpotPage";
import AddSpotPage from "./pages/AddSpotPage";
import AboutPage from "./pages/AboutPage";
import PricingPage from "./pages/PricingPage";
import ContactPage from "./pages/ContactPage";
import ProfilePage from "./pages/ProfilePage";
import SpotDetailsPage from "./pages/SpotDetailsPage";
import CheckoutSimulatorPage from "./pages/CheckoutSimulatorPage";
import BookingSuccessPage from "./pages/BookingSuccessPage";

export default function App() {
  const location = useLocation();
  const isMapRoute = location.pathname === "/find";

  return (
    <div
      className={
        isMapRoute
          ? "h-screen w-full flex flex-col overflow-hidden bg-white text-[#0F172A]"
          : "min-h-screen w-full flex flex-col bg-[#F4F6F8] text-[#0F172A]"
      }
    >
      <Header />

      <main className={isMapRoute ? "flex-1 w-full min-h-0 relative" : "flex-grow w-full"}>
        <ErrorBoundary key={location.pathname}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/find" element={<MapPage />} />
            <Route path="/spots/:id" element={<SpotDetailsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Driver Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/checkout-simulator" element={<CheckoutSimulatorPage />} />
              <Route path="/booking-success" element={<BookingSuccessPage />} />
            </Route>

            {/* Host Protected Routes */}
            <Route element={<HostRoute />}>
              <Route path="/host/dashboard" element={<HostDashboardPage />} />
              <Route path="/host/edit-spot/:id" element={<EditSpotPage />} />
              <Route path="/host/add-spot" element={<AddSpotPage />} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#FFFFFF",
            color: "#0F172A",
            border: "1px solid #DDE3EA",
            fontSize: "13px",
            boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.08)",
            borderRadius: "10px",
          },
        }}
      />

      <Footer />
    </div>
  );
}
