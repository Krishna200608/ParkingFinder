import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Shield, LogOut, Plus, Phone, Car, Save, CheckCircle2 } from "lucide-react";
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
  const [isSaving, setIsSaving] = useState(false);

  // Form states for profile enrichment
  const [phone, setPhone] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [licensePlate, setLicensePlate] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get("/api/auth/profile", { withCredentials: true });
        setProfile(data);
        setPhone(data.phone || "");
        setVehicleMake(data.vehicleInfo?.make || "");
        setVehicleModel(data.vehicleInfo?.model || "");
        setLicensePlate(data.vehicleInfo?.licensePlate || "");
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile details");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data } = await axios.put(
        "/api/auth/profile",
        {
          phone,
          vehicleInfo: {
            make: vehicleMake,
            model: vehicleModel,
            licensePlate,
          },
        },
        { withCredentials: true }
      );
      if (data?.user) {
        setProfile(data.user);
        login(data.user);
        toast.success("Profile updated successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

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
      const { data } = await axios.post(
        "/api/auth/switch-role",
        { role: targetRole },
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
        description="Manage your user identity, verified role permissions, contact info, and registered vehicle."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Profile" },
        ]}
      />

      {/* Account Identity Card */}
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

      {/* Profile Details & Vehicle Information Form */}
      <Card padding="lg">
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <h3 className="text-sm font-bold text-[#0F172A] pb-2 border-b border-[#F1F5F9] flex items-center gap-2">
            <User size={15} className="text-[#2563EB]" />
            Personal & Contact Details
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                Display Username
              </label>
              <input
                type="text"
                disabled
                value={profile?.username || ""}
                className="w-full px-3 py-2 border border-[#DDE3EA] rounded-lg text-xs bg-slate-50 text-[#64748B] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                Contact Phone Number
              </label>
              <div className="relative">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-[#DDE3EA] rounded-lg text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>
          </div>

          <h3 className="text-sm font-bold text-[#0F172A] pt-4 pb-2 border-b border-[#F1F5F9] flex items-center gap-2">
            <Car size={15} className="text-[#2563EB]" />
            Registered Vehicle (For Space Hosts & Attendants)
          </h3>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                Vehicle Make
              </label>
              <input
                type="text"
                placeholder="e.g. Honda, Tesla, Toyota"
                value={vehicleMake}
                onChange={(e) => setVehicleMake(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE3EA] rounded-lg text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                Vehicle Model
              </label>
              <input
                type="text"
                placeholder="e.g. Civic, Model 3, RAV4"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE3EA] rounded-lg text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">
                License Plate
              </label>
              <input
                type="text"
                placeholder="e.g. 7XYZ123"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE3EA] rounded-lg text-xs uppercase font-mono text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#F1F5F9] flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              className="flex items-center gap-1.5"
            >
              <Save size={13} />
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
