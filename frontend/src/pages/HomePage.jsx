import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="text-center p-10">
      <h1 className="text-5xl font-bold mb-6">Welcome to Parking Finder</h1>
      <p className="text-xl text-gray-700 mb-8">
        Your seamless solution for finding and managing parking in the city.
      </p>
      <div className="space-x-4">
        <Link 
          to="/find"
          className="bg-blue-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-blue-700 shadow-lg"
        >
          Find a Spot
        </Link>
        <Link 
          to="/register"
          className="bg-gray-200 text-gray-800 px-8 py-3 rounded-full text-lg font-semibold hover:bg-gray-300 shadow-lg"
        >
          Become a Host
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
