import React from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import HostRoute from "./components/HostRoute";

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


function App() {
	return (
		<div className="flex flex-col w-full min-h-screen bg-gray-50 text-gray-800 overflow-hidden">
			<Header />
			<main className="flex-grow container mx-auto px-4 py-6 w-full">
				<Routes>
					{/* Public */}
					<Route path="/" element={<HomePage />} />
					<Route path="/find" element={<MapPage />} />
					<Route path="/login" element={<LoginPage />} />
					<Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          
					{/* Driver protected */}
					<Route element={<ProtectedRoute />}>
						<Route path="/dashboard" element={<DashboardPage />} />
					</Route>

					{/* Host protected */}
					<Route element={<HostRoute />}>
						<Route path="/host/dashboard" element={<HostDashboardPage />} />
						<Route path="/host/edit-spot/:id" element={<EditSpotPage />} />
						<Route path="/host/add-spot" element={<AddSpotPage />} />
					</Route>
					<Route path="/about" element={<AboutPage />} />
					<Route path="/pricing" element={<PricingPage />} />
					<Route path="/contact" element={<ContactPage />} />
				</Routes>
			</main>

			<Toaster position="top-center" />

			<Footer />
		</div>
	);
}

export default App;
