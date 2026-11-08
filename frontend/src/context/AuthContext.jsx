import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Enable credentials so HTTP-only cookies are sent on all axios requests
axios.defaults.withCredentials = true;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(() => {
    // Hydrate from localStorage so the UI does not flash "logged out" on reload.
    // The verifySession effect below immediately validates this against the server.
    const stored = localStorage.getItem("userInfo");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  // On mount: validate the HTTP-only cookie by hitting /api/auth/profile.
  // This is the single authoritative session check — no token in localStorage needed.
  useEffect(() => {
    const verifySession = async () => {
      try {
        const { data } = await axios.get("/api/auth/profile", { withCredentials: true });
        setUserInfo(data);
        localStorage.setItem("userInfo", JSON.stringify(data));
      } catch {
        // Cookie absent or expired — clear any stale cached state
        setUserInfo(null);
        localStorage.removeItem("userInfo");
      } finally {
        setLoading(false);
      }
    };
    verifySession();
  }, []);

  /**
   * Called after a successful login, registration, or role-switch response.
   * Stores only the user object for UI hydration — the JWT is kept in the
   * HTTP-only cookie set by the server and never stored in JavaScript-accessible storage.
   */
  const login = (data) => {
    const user = data?.user || data;
    if (user?._id) {
      localStorage.setItem("userInfo", JSON.stringify(user));
      setUserInfo(user);
    }
  };

  /** Clears server-side cookie and all local state. */
  const logout = async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
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
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
