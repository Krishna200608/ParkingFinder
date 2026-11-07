import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Shield, LogOut, Plus, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import PageHeader from "../components/ui/PageHeader";

export default function ProfilePage() {
  const { logout, login, userInfo } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get("/api/auth/profile", { withCredentials: true });
        setProfile(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile details");
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
      toast.success("Signed out successfully");
      navigate("/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  const handleSwitchRole = async (targetRole) => {
    try {
      setIsSwitchingRole(true);
      const targetUserId = profile?._id || userInfo?._id;
      const { data } = await axios.post(
        "/api/auth/switch-role",
        { role: targetRole, userId: targetUserId },
        { withCredentials: true }
      );
      if (data?.user) {
        login(data);
        setProfile(data.user);
        toast.success(data.message || `Switched to ${targetRole} mode`);
      }
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 401) {
        toast.error("Your session has expired. Please sign in again.");
        navigate("/login");
      } else {
        toast.error(err?.response?.data?.message || "Failed to switch role");
      }
    } finally {
      setIsSwitchingRole(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-2">
        <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#334155]">Loading account profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-20 space-y-6">
      <PageHeader
        title="Account Settings"
        description="View your user identity, verified role permissions, and session access details."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Profile" },
        ]}
      />

      <Card padding="lg">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar Icon */}
          <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] text-2xl font-bold flex items-center justify-center shrink-0">
            {profile?.username?.charAt(0).toUpperCase() || "U"}
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-lg font-bold text-[#0F172A]">
                  {profile?.username || "Authenticated User"}
                </h2>
                <Badge variant={profile?.role === "host" ? "purple" : "brand"} size="sm">
                  {profile?.role === "host" ? "Space Host" : "Driver"}
                </Badge>
              </div>
              <p className="text-xs text-[#334155] mt-0.5">{profile?.email}</p>
            </div>

            <div className="pt-3 border-t border-[#F1F5F9] grid sm:grid-cols-2 gap-3 text-xs text-[#334155]">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-[#2563EB] shrink-0" />
                <span>Email: {profile?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-[#2563EB] shrink-0" />
                <span>Account Role: <strong className="capitalize text-[#0F172A]">{profile?.role}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="mt-6 pt-5 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {profile?.role === "driver" ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSwitchRole("host")}
                isLoading={isSwitchingRole}
              >
                <Plus size={13} />
                <span>Activate Host Status</span>
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSwitchRole("driver")}
                isLoading={isSwitchingRole}
              >
                <span>Switch to Driver Mode</span>
              </Button>
            )}
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={handleLogout}
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
