import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

// Reusable small input/button wrapper components are used if present
import FormContainer from "../components/form/FormContainer";
import Input from "../components/form/Input";
import Button from "../components/form/Button";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { setAuthToken, login } = useAuth(); // keep using your AuthContext API
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Login — Parking Finder";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      // Keep your existing API endpoint intact
      const res = await axios.post("/api/auth/login", { email, password });
      const data = res.data;
      // If your AuthContext expects a token or user object, preserve that flow
      if (data?.token) {
        setAuthToken(data.token);
        toast.success("Logged in successfully");
        // login() from context might fetch user info; call it or set redirect
        await login(data); // keep existing side-effects in context
        navigate("/dashboard");
      } else {
        toast.error("Login failed: invalid response");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <FormContainer>
        <h2 className="text-2xl font-semibold text-center mb-4">Login</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <p className="text-sm text-center mt-4 text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </FormContainer>
    </div>
  );
};

export default LoginPage;
