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
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    }

    const verifySession = async () => {
      try {
        const { data } = await axios.get("/api/auth/profile", { withCredentials: true });
        setUserInfo(data);
        localStorage.setItem("userInfo", JSON.stringify(data));
      } catch {
        // If cookie is invalid or absent, clear cached user info
        setUserInfo(null);
        localStorage.removeItem("userInfo");
        localStorage.removeItem("authToken");
        delete axios.defaults.headers.common["Authorization"];
      } finally {
        setLoading(false);
      }
    };
    verifySession();
  }, []);

  // Called after login / registration / role-switch
  const login = (data) => {
    const user = data?.user || data;
    const token = data?.token;
    if (user?._id) {
      localStorage.setItem("userInfo", JSON.stringify(user));
      setUserInfo(user);
    }
    if (token) {
      localStorage.setItem("authToken", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  };

  // Backwards-compatible helper
  const setAuthToken = (token) => {
    if (token) {
      localStorage.setItem("authToken", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  };

  // Logout clears server-side cookie and local state
  const logout = async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.warn("Logout request failed:", err.message);
    }
    localStorage.removeItem("userInfo");
    localStorage.removeItem("authToken");
    delete axios.defaults.headers.common["Authorization"];
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
