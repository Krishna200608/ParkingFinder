import React from "react";

export default function Card({
  children,
  className = "",
  padding = "default",
  variant = "default", // 'default' | 'dark' | 'muted' | 'plain'
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

  const hasCustomBg = /\bbg-\S+/.test(className);
  const hasCustomBorder = /\bborder-\S+/.test(className);

  let baseSurface = "";
  if (variant === "dark") {
    baseSurface = `${hasCustomBg ? "" : "bg-[#17243A]"} text-white ${hasCustomBorder ? "" : "border border-slate-800"} shadow-sm`;
  } else if (variant === "muted") {
    baseSurface = `${hasCustomBg ? "" : "bg-[#F8FAFC]"} ${hasCustomBorder ? "" : "border border-[#DDE3EA]"} shadow-2xs`;
  } else if (variant === "plain") {
    baseSurface = "";
  } else {
    const bgPart = hasCustomBg ? "" : "bg-white";
    const borderPart = hasCustomBorder ? "" : "border border-[#DDE3EA]";
    baseSurface = `${bgPart} ${borderPart} shadow-2xs`.trim();
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-xl ${baseSurface} ${
        hover ? "hover:border-[#CBD5E1] hover:shadow-xs transition-all cursor-pointer" : ""
      } ${paddingClasses[padding] || paddingClasses.default} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
