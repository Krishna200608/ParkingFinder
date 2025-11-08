import React from "react";

const Button = ({ children,className = "", type = "submit", isLoading = false }) => {
	return (
		<button
			type={type}
			disabled={isLoading}
			className={`w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-60 ${className}`}
		>
			{isLoading ? "Please wait..." : children}
		</button>
	);
};

export default Button;
