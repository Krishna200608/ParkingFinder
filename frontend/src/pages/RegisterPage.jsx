import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Mail, Lock, User } from "lucide-react";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("driver");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Register — Parking Finder";
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await axios.post("/api/auth/register", { name, email, password, role });
      toast.success("Registered successfully! Please login.");
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left gradient banner */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-blue-600 to-blue-400 text-white flex-col justify-center items-center px-10">
        <div className="max-w-sm text-center">
          <h1 className="text-4xl font-bold mb-4">Join ParkingFinder</h1>
          <p className="text-blue-100 text-lg mb-10">
            Register to start finding parking or hosting your own spot today.
          </p>

          {/* ✅ Fixed Image Aspect Ratio */}
          <div className="w-full flex justify-center">
            <img
              src="/src/assets/logo.svg"
              alt="Parking Finder Logo"
              className="w-64 h-64 object-contain rounded-lg shadow-md"
            />
          </div>
        </div>
      </div>

      {/* Right form section */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 py-12 px-6">
        <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <UserPlus className="text-blue-600 mr-2" />
            <h2 className="text-2xl font-semibold text-gray-800">
              Create Account
            </h2>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="text-sm text-gray-600 mb-1 block">
                Full Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  className="w-full border rounded-md py-2 pl-10 pr-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Email</label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
                <input
                  type="email"
                  className="w-full border rounded-md py-2 pl-10 pr-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-gray-600 mb-1 block">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
                <input
                  type="password"
                  className="w-full border rounded-md py-2 pl-10 pr-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="driver">Driver</option>
                <option value="host">Host</option>
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition"
            >
              {isLoading ? "Creating..." : "Create Account"}
            </button>
          </form>

          <p className="text-sm text-center mt-6 text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
