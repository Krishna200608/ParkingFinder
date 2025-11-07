import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);

  // On initial load, check localStorage for user info
  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser));
    }
  }, []);

  // Login function: save to state and localStorage
  const login = (userData) => {
    // Make sure we store all user data, including the role
    const userDataToStore = {
      _id: userData._id,
      name: userData.name,
      email: userData.email,
      role: userData.role, // <-- ENSURE ROLE IS SAVED
      token: userData.token,
    };
    setUserInfo(userDataToStore);
    localStorage.setItem('userInfo', JSON.stringify(userDataToStore));
  };

  // Logout function: clear state and localStorage
  const logout = () => {
    setUserInfo(null);
    localStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider value={{ userInfo, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily access auth context
export const useAuth = () => {
  return useContext(AuthContext);
};