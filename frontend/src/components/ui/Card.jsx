import React from "react";

export default function Card({
  children,
  className = "",
  padding = "default",
  hover = false,
  onClick,
  ...props
}) {
  const paddingClasses = {
    none: "p-0",
    sm: "p-3 sm:p-4",
    default: "p-4 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-[#DDE3EA] shadow-2xs ${
        hover ? "hover:border-[#CBD5E1] hover:shadow-xs transition-all cursor-pointer" : ""
      } ${paddingClasses[padding] || paddingClasses.default} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
