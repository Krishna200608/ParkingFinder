import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { LogIn, Mail, Lock } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { setAuthToken, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Login — Parking Finder";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await axios.post("/api/auth/login", { email, password });
      const data = res.data;

      if (data?.token) {
        setAuthToken(data.token);
        await login(data);
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        toast.error("Invalid login response");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Banner */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-blue-600 to-blue-400 text-white flex-col justify-center items-center px-10">
        <div className="max-w-sm text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
          <p className="text-blue-100 text-lg mb-10">
            Log in to find and manage your parking reservations effortlessly.
          </p>

          {/* ✅ Fixed Image Styling */}
          <div className="w-full flex justify-center">
            <img
              src="/src/assets/logo.svg"
              alt="Parking Finder Logo"
              className="w-64 h-64 object-contain rounded-lg shadow-md"
            />
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 py-12 px-6">
        <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <LogIn className="text-blue-600 mr-2" />
            <h2 className="text-2xl font-semibold text-gray-800">Login</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
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

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-sm text-center mt-6 text-gray-600">
            Don’t have an account?{" "}
            <Link to="/register" className="text-blue-600 hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
