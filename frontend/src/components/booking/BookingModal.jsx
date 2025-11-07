import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// This is the new component for handling the booking process.
const BookingModal = ({ spot, onClose }) => {
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 3600 * 1000)); // Default 1 hour
  const [isLoading, setIsLoading] = useState(false);
  
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  // Calculate total cost
  const durationHours = (endTime - startTime) / (1000 * 60 * 60);
  const totalCost = (durationHours * spot.pricePerHour).toFixed(2);

  const handleBooking = async () => {
    if (!userInfo) {
      toast.error('You must be logged in to book a spot.');
      navigate('/login');
      return;
    }

    if (durationHours <= 0) {
      toast.error('End time must be after the start time.');
      return;
    }

    setIsLoading(true);
    try {
      // Get the token from our auth context
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      // Call the booking API
      await axios.post(
        '/api/bookings',
        {
          spotId: spot._id,
          startTime,
          endTime,
          totalCost,
        },
        config
      );

      toast.success('Booking Successful!');
      onClose(); // Close the modal
      // Optionally, navigate to a "My Bookings" page
      // navigate('/my-bookings');

    } catch (error) {
      const message = error.response?.data?.message || 'Booking failed. Spot may be unavailable.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Modal Overlay
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[2000]"
      onClick={onClose} // Close modal on overlay click
    >
      {/* Modal Content */}
      <div 
        className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()} // Prevent overlay click from triggering
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Book Spot</h2>
          <button onClick={onClose} className="text-gray-500 text-2xl">&times;</button>
        </div>
        
        {/* Spot Details */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold">{spot.address}</h3>
          <p className="text-lg text-gray-700">{spot.description}</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">${spot.pricePerHour.toFixed(2)} / hour</p>
        </div>
        
        {/* Date & Time Pickers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <DatePicker
              selected={startTime}
              onChange={(date) => setStartTime(date)}
              showTimeSelect
              dateFormat="Pp"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              minDate={new Date()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <DatePicker
              selected={endTime}
              onChange={(date) => setEndTime(date)}
              showTimeSelect
              dateFormat="Pp"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              minDate={startTime} // End time cannot be before start time
            />
          </div>
        </div>
        
        {/* Cost & Booking Button */}
        <div className="bg-gray-100 p-4 rounded-lg flex justify-between items-center">
          <div>
            <span className="text-lg font-medium text-gray-700">Total Cost:</span>
            <span className="text-2xl font-bold text-gray-900 ml-2">${totalCost}</span>
          </div>
          <button
            onClick={handleBooking}
            disabled={isLoading}
            className={`py-2 px-6 border border-transparent rounded-md shadow-sm text-lg font-medium text-white 
            ${isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {isLoading ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
        
        {!userInfo && (
          <p className="text-red-500 text-center mt-4">
            You must be logged in to complete a booking.
          </p>
        )}
      </div>
    </div>
  );
};

export default BookingModal;