import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Get auth state
import toast from 'react-hot-toast';
import axios from 'axios';

const Header = () => {
  // Get user info and logout function from global context
  const { userInfo, logout } = useAuth();

  const logoutHandler = async () => {
    try {
      // Call the backend logout endpoint
      // Our Vite proxy will redirect this to http://localhost:5001/api/auth/logout
      await axios.post('/api/auth/logout');
      
      // Call the logout function from our context
      logout(); 
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed. Please try again.');
      console.error(error);
    }
  };

  return (
    <header className="bg-white shadow-md">
      <nav className="container mx-auto p-4 flex justify-between items-center">
        {/* Logo/Brand Name */}
        <Link to="/" className="text-2xl font-bold text-blue-600">
          ParkingFinder
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-4">
          <Link to="/find" className="text-gray-600 hover:text-blue-500">
            Find Parking
          </Link>
          
          {/* Conditional links based on login state */}
          {userInfo ? (
            <>
              {/* Show host links if user is a host */}
              {userInfo.role === 'host' && (
                <Link to="/host/dashboard" className="text-gray-600 hover:text-blue-500">
                  My Spots
                </Link>
              )}
              
              {/* Show driver links */}
              <Link to="/mybookings" className="text-gray-600 hover:text-blue-500">
                My Bookings
              </Link>
              
              <span className="font-semibold">Hello, {userInfo.username}</span>
              
              <button
                onClick={logoutHandler}
                className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              {/* Show these links if user is logged out */}
              <Link
                to="/login"
                className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-gray-600 hover:text-blue-500"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
