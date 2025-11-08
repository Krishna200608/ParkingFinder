import React from "react";

const Input = ({
	id,
	label,
	type = "text",
	value,
	onChange,
	placeholder,
  className = "",
	required = false,
}) => {
	return (
		<div>
			<label htmlFor={id} className="block text-sm font-medium text-gray-700">
				{label}
			</label>
			<input
				type={type}
				id={id}
				name={id}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				required={required}
				className={`w-full border border-gray-200 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 ${className}`}
			/>
		</div>
	);
};

export default Input;
