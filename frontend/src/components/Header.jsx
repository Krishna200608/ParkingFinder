import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Header = () => {
  const { userInfo, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-3xl font-bold text-blue-600">
          ParkingFinder
        </Link>
        
        <div className="flex items-center space-x-6">
          <Link to="/find" className="text-gray-700 hover:text-blue-600 text-lg">
            Find Parking
          </Link>

          {userInfo ? (
            <>
              {/* --- NEW HOST LINK --- */}
              {userInfo.role === 'host' && (
                <Link to="/host/dashboard" className="text-gray-700 hover:text-blue-600 text-lg">
                  Host Dashboard
                </Link>
              )}
            
              <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 text-lg">
                My Dashboard
              </Link>
              
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 text-lg"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-blue-600 text-lg">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-lg"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;