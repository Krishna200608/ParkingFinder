import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import FormContainer from "../components/form/FormContainer";
import Input from "../components/form/Input";
import Button from "../components/form/Button";

/**
 * Simple registration page that posts to /api/auth/register
 */
const RegisterPage = () => {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState("driver");
	const [isLoading, setIsLoading] = useState(false);

	const navigate = useNavigate();

	const handleRegister = async (e) => {
		e.preventDefault();
		try {
			setIsLoading(true);
			const { data } = await axios.post("/api/auth/register", {
				name,
				email,
				password,
				role,
			});
			toast.success("Registered. Please login.");
			navigate("/login");
		} catch (err) {
			console.error(err);
			toast.error(err?.response?.data?.message || "Registration failed");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<FormContainer>
			<h2 className="text-2xl font-semibold text-center mb-4">
				Create Account
			</h2>
			<form onSubmit={handleRegister} className="space-y-3">
				<Input
					placeholder="Full name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
				/>
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

				<div className="flex items-center gap-3">
					<label className="text-sm">I am a:</label>
					<select
						value={role}
						onChange={(e) => setRole(e.target.value)}
						className="border px-3 py-2 rounded"
					>
						<option value="driver">Driver</option>
						<option value="host">Host</option>
					</select>
				</div>

				<Button isLoading={isLoading}>Create account</Button>
			</form>
		</FormContainer>
	);
};

export default RegisterPage;
