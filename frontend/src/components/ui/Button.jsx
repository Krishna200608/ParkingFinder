import React from "react";
import { Link } from "react-router-dom";

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
  href,
  to,
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer";

  const sizeClasses = {
    sm: "text-xs px-2.5 py-1.5 rounded-lg gap-1.5 h-8",
    md: "text-sm px-4 py-2 rounded-lg gap-2 h-10",
    lg: "text-base px-5 py-2.5 rounded-xl gap-2.5 h-12",
  };

  const variantClasses = {
    primary:
      "bg-blue-600 text-white font-semibold hover:bg-blue-700 active:bg-blue-800 shadow-xs border border-blue-600",
    secondary:
      "bg-white text-[#0F172A] font-semibold hover:bg-[#F8FAFC] active:bg-[#F1F5F9] border border-[#CBD5E1] shadow-2xs",
    outline:
      "bg-white text-[#0F172A] font-semibold hover:bg-[#F8FAFC] active:bg-[#F1F5F9] border border-[#CBD5E1] shadow-2xs",
    ghost:
      "bg-transparent text-[#334155] font-medium hover:text-[#0F172A] hover:bg-[#F1F5F9]",
    dark:
      "bg-slate-800 text-white font-semibold hover:bg-slate-700 active:bg-slate-900 border border-slate-700 shadow-xs",
    darkOutline:
      "bg-transparent text-white font-semibold hover:bg-white/10 active:bg-white/20 border border-white/20",
    danger:
      "bg-[#DC4545] text-white font-semibold hover:bg-[#B91C1C] active:bg-[#991B1B] shadow-xs border border-[#DC4545]",
    dangerOutline:
      "bg-white text-[#DC4545] font-semibold border border-red-300 hover:bg-red-50 active:bg-red-100",
  };

  const destination = to || href;

  const content = (
    <>
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
    </>
  );

  const combinedClasses = `${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${
    variantClasses[variant] || variantClasses.primary
  } ${className}`.trim();

  // If a destination link is provided, render Link or anchor
  if (destination && !disabled && !isLoading) {
    const isExternal =
      destination.startsWith("http://") ||
      destination.startsWith("https://") ||
      destination.startsWith("//") ||
      destination.startsWith("mailto:");

    if (isExternal) {
      return (
        <a
          href={destination}
          target="_blank"
          rel="noreferrer"
          onClick={onClick}
          className={combinedClasses}
          {...props}
        >
          {content}
        </a>
      );
    }

    return (
      <Link
        to={destination}
        onClick={onClick}
        className={combinedClasses}
        {...props}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={combinedClasses}
      {...props}
    >
      {content}
    </button>
  );
}
