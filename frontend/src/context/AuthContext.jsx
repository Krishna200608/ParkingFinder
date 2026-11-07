import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Enable credentials so cookies are sent on all axios requests
axios.defaults.withCredentials = true;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(() => {
    const stored = localStorage.getItem("userInfo");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  // Synchronize user session from HTTP-only cookie on mount
  useEffect(() => {
    const verifySession = async () => {
      try {
        const { data } = await axios.get("/api/auth/profile");
        setUserInfo(data);
        localStorage.setItem("userInfo", JSON.stringify(data));
      } catch {
        // If cookie is invalid or absent, clear cached user info
        setUserInfo(null);
        localStorage.removeItem("userInfo");
      } finally {
        setLoading(false);
      }
    };
    verifySession();
  }, []);

  // Called after login / registration
  const login = (data) => {
    const user = data?.user || data;
    if (user?._id) {
      localStorage.setItem("userInfo", JSON.stringify(user));
      setUserInfo(user);
    }
  };

  // Backwards-compatible helper
  const setAuthToken = () => {};

  // Logout clears server-side cookie and local state
  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch (err) {
      console.warn("Logout request failed:", err.message);
    }
    localStorage.removeItem("userInfo");
    setUserInfo(null);
  };

  return (
    <AuthContext.Provider
      value={{
        userInfo,
        setUserInfo,
        login,
        logout,
        setAuthToken,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
