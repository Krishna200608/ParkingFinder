import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Components
import Header from './components/Header.jsx';

// Pages
import HomePage from './pages/HomePage.jsx';
// import LoginPage from './pages/LoginPage.jsx';
// import RegisterPage from './pages/RegisterPage.jsx';
// import MapPage from './pages/MapPage.jsx';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      {/* Toast Notifications */}
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      {/* Header / Navbar */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto p-4 flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          {/* <Route path="/login" element={<LoginPage />} /> */}
          {/* <Route path="/register" element={<RegisterPage />} /> */}
          {/* <Route path="/find" element={<MapPage />} /> */}

          {/* Private or Protected routes can be wrapped later */}
        </Routes>
      </main>

      {/* Footer */}
      <footer className="text-center p-4 bg-gray-800 text-white mt-auto">
        <p className="text-sm">Parking Finder © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
