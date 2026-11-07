import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, Info, ArrowRight } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("driver");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Create Account — ParkingFinder";
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      setIsLoading(true);
      await axios.post("/api/auth/register", {
        username: name,
        email,
        password,
        role,
      });

      toast.success("Account created successfully! Please sign in.");
      navigate("/login");
    } catch (err) {
      console.error("Registration Error:", err);
      const serverMsg = err?.response?.data?.message || "Registration failed";

      if (serverMsg.includes("E11000") && serverMsg.includes("username")) {
        toast.error("Username already taken — please choose a different one.");
      } else if (serverMsg.includes("E11000") && serverMsg.includes("email")) {
        toast.error("Email already registered — try signing in instead.");
      } else if (serverMsg.includes("validation failed")) {
        const cleanMsg = serverMsg
          .replace("Server error: User validation failed:", "")
          .replace(/username:/gi, "Username:")
          .replace(/password:/gi, "Password:")
          .trim();
        toast.error(cleanMsg);
      } else {
        toast.error(serverMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-sm shadow-2xs group-hover:bg-blue-700 transition-colors">
              P
            </div>
            <span className="font-bold text-lg text-[#17243A] tracking-tight">
              ParkingFinder
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-[#17243A] tracking-tight">
            Create an account
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Join thousands of urban commuters and space hosts.
          </p>
        </div>

        {/* Card Container */}
        <Card padding="lg" className="shadow-xs bg-white">
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#475569] font-medium mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
                <input
                  type="text"
                  className="w-full bg-white border border-[#DDE3EA] rounded-lg pl-9 pr-3 py-2.5 text-sm text-[#17243A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder="alex_driver"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[#475569] font-medium mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
                <input
                  type="email"
                  className="w-full bg-white border border-[#DDE3EA] rounded-lg pl-9 pr-3 py-2.5 text-sm text-[#17243A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[#475569] font-medium mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-white border border-[#DDE3EA] rounded-lg pl-9 pr-10 py-2.5 text-sm text-[#17243A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] hover:text-[#17243A] cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-1">
                Must be at least 6 characters long.
              </p>
            </div>

            <div>
              <label className="block text-[#475569] font-medium mb-1.5">
                Account Purpose
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("driver")}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold text-center transition cursor-pointer ${
                    role === "driver"
                      ? "bg-blue-50 border-blue-200 text-[#2563EB]"
                      : "bg-white border-[#DDE3EA] text-[#475569] hover:bg-[#F8FAFC]"
                  }`}
                >
                  Driver (Search & Park)
                </button>
                <button
                  type="button"
                  onClick={() => setRole("host")}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold text-center transition cursor-pointer ${
                    role === "host"
                      ? "bg-blue-50 border-blue-200 text-[#2563EB]"
                      : "bg-white border-[#DDE3EA] text-[#475569] hover:bg-[#F8FAFC]"
                  }`}
                >
                  Host (Monetize Space)
                </button>
              </div>
            </div>

            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isLoading}
                className="w-full justify-center py-2.5"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </div>
          </form>

          <div className="mt-5 pt-4 border-t border-[#F1F5F9] text-center text-xs text-[#64748B]">
            Already have an account?{" "}
            <Link to="/login" className="text-[#2563EB] font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
