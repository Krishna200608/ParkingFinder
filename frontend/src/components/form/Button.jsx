import React from 'react';

const Button = ({ children, type = 'submit', isLoading = false }) => {
  return (
    <button
      type={type}
      disabled={isLoading}
      className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
      ${isLoading 
        ? 'bg-gray-400 cursor-not-allowed' 
        : 'bg-blue-600 hover:bg-blue-700'
      } 
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
};

export default Button;
