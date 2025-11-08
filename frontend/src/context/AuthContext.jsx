import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(() => {
    const stored = localStorage.getItem("userInfo");
    return stored ? JSON.parse(stored) : null;
  });

  // Called after login
  const login = (data) => {
    if (data?.token && data?.user) {
      localStorage.setItem("userInfo", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      setUserInfo(data.user);
    }
  };

  // Optional helper — used in older code, now works fine
  const setAuthToken = (token) => {
    if (token) {
      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  // Logout clears everything
  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch (err) {
      console.warn("Logout request failed:", err.message);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    delete axios.defaults.headers.common["Authorization"];
    setUserInfo(null);
  };

  // Automatically attach token on page reload
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userInfo,
        setUserInfo,
        login,
        logout,
        setAuthToken, // ✅ Fix: this now exists
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
