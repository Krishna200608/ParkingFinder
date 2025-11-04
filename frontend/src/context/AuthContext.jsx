import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. Create the Context
const AuthContext = createContext();

// 2. Create the Provider component
export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);

  // 3. Check localStorage on initial load
  useEffect(() => {
    // Try to find user data in localStorage
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser));
    }
  }, []);

  // 4. Define the login/logout functions
  const login = (userData) => {
    // Set state
    setUserInfo(userData);
    // Persist to localStorage
    localStorage.setItem('userInfo', JSON.stringify(userData));
  };

  const logout = () => {
    // Clear state
    setUserInfo(null);
    // Remove from localStorage
    localStorage.removeItem('userInfo');
  };

  // 5. Provide the state and functions to children
  return (
    <AuthContext.Provider value={{ userInfo, login, logout, setUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

// 6. Create a custom hook for easy access
export const useAuth = () => {
  return useContext(AuthContext);
};
