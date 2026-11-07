import React from "react";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  isLoading = false,
  onClick,
  className = "",
  icon: Icon,
  iconPosition = "left",
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none";

  const sizeClasses = {
    sm: "text-xs px-2.5 py-1.5 rounded-lg gap-1.5 h-8",
    md: "text-sm px-4 py-2 rounded-lg gap-2 h-10",
    lg: "text-base px-5 py-2.5 rounded-xl gap-2.5 h-12",
  };

  const variantClasses = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-xs border border-blue-600",
    secondary:
      "bg-[#F4F6F8] text-[#17243A] hover:bg-[#E2E8F0] active:bg-[#CBD5E1] border border-[#DDE3EA]",
    outline:
      "bg-white text-[#17243A] hover:bg-[#F4F6F8] active:bg-[#E2E8F0] border border-[#DDE3EA] shadow-2xs",
    ghost:
      "bg-transparent text-[#64748B] hover:text-[#17243A] hover:bg-[#F4F6F8]",
    danger:
      "bg-[#DC4545] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] shadow-xs border border-[#DC4545]",
    dangerOutline:
      "bg-white text-[#DC4545] border border-red-200 hover:bg-red-50 active:bg-red-100",
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.primary
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === "left" && <Icon size={size === "sm" ? 14 : 16} aria-hidden="true" />}
          {children}
          {Icon && iconPosition === "right" && <Icon size={size === "sm" ? 14 : 16} aria-hidden="true" />}
        </>
      )}
    </button>
  );
}
