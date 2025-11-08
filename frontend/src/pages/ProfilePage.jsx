import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Shield, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { userInfo, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const config = {
          withCredentials: true,
          headers: userInfo?.token
            ? { Authorization: `Bearer ${userInfo.token}` }
            : {},
        };
        const { data } = await axios.get("/api/auth/profile", config);
        setProfile(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
      logout();
      toast.success("Logged out successfully!");
      navigate("/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  if (loading)
    return (
      <div className="h-[70vh] flex items-center justify-center text-gray-500">
        Loading profile...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-400 text-white py-12 text-center shadow">
        <h1 className="text-3xl font-bold mb-1">My Profile</h1>
        <p className="text-blue-100 text-sm">
          Manage your account and view personal details.
        </p>
      </section>

      {/* Profile Card */}
      <div className="max-w-3xl mx-auto mt-10 px-6">
        <div className="bg-white shadow-lg rounded-2xl border border-gray-100 p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-semibold">
              {profile?.username?.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                {profile?.username || "User"}
              </h2>
              <div className="space-y-2 text-gray-600">
                <p className="flex items-center gap-2">
                  <Mail size={18} className="text-blue-600" />
                  {profile?.email}
                </p>
                <p className="flex items-center gap-2">
                  <Shield size={18} className="text-blue-600" />
                  Role:{" "}
                  <span className="font-medium capitalize">
                    {profile?.role}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <User size={18} className="text-blue-600" />
                  User ID:{" "}
                  <span className="text-gray-500 text-sm">
                    {profile?._id}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t mt-6 mb-6"></div>

          {/* Actions */}
          <div className="flex justify-end">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
