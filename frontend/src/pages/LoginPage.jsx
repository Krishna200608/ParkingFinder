import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Sign In — ParkingFinder";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await axios.post("/api/auth/login", { email, password });
      const data = res.data;

      if (data?.user) {
        login(data.user);
        toast.success("Welcome back!");
        navigate(data.user.role === "host" ? "/host/dashboard" : "/dashboard");
      } else {
        toast.error("Invalid response from server");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-sm">
              P
            </div>
            <span className="font-bold text-lg text-[#17243A] tracking-tight">
              ParkingFinder
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-[#17243A] tracking-tight">
            Sign in to your account
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Access your reservations and parking listings.
          </p>
        </div>

        {/* Card Container */}
        <Card padding="lg" className="shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#475569] font-medium mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={15} />
                <input
                  type="email"
                  className="w-full border border-[#DDE3EA] rounded-lg pl-9 pr-3 py-2 text-xs text-[#17243A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[#475569] font-medium mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={15} />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full border border-[#DDE3EA] rounded-lg pl-9 pr-10 py-2 text-xs text-[#17243A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] hover:text-[#17243A] cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isLoading}
                className="w-full justify-center"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </div>
          </form>

          <div className="mt-5 pt-4 border-t border-[#F1F5F9] text-center text-xs text-[#64748B]">
            Don’t have an account?{" "}
            <Link to="/register" className="text-[#2563EB] font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
