import React from "react";

export function Input({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  className = "",
  error = false,
  icon: Icon,
  ...props
}) {
  return (
    <div className="relative w-full">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
          <Icon size={16} aria-hidden="true" />
        </div>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`w-full rounded-lg border bg-white text-[#17243A] placeholder-[#94A3B8] text-sm h-10 px-3 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-[#F4F6F8] disabled:text-[#94A3B8] disabled:cursor-not-allowed ${
          Icon ? "pl-9" : ""
        } ${
          error ? "border-[#DC4545] focus:ring-red-500/20 focus:border-[#DC4545]" : "border-[#DDE3EA]"
        } ${className}`}
        {...props}
      />
    </div>
  );
}

export function FormField({
  label,
  id,
  error,
  hint,
  required = false,
  children,
  className = "",
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex justify-between items-center">
          <label htmlFor={id} className="block text-xs font-semibold text-[#17243A]">
            {label} {required && <span className="text-[#DC4545]">*</span>}
          </label>
          {hint && <span className="text-[11px] text-[#64748B]">{hint}</span>}
        </div>
      )}
      {children}
      {error && <p className="text-xs text-[#DC4545] mt-1">{error}</p>}
    </div>
  );
}
