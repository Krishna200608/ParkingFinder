import React from "react";

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
}) {
  const sizeClasses = {
    sm: "text-[11px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
  };

  const variantClasses = {
    neutral: "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]",
    brand: "bg-blue-50 text-blue-700 border-blue-200",
    success: "bg-[#ECFDF5] text-[#16845B] border-[#A7F3D0]",
    warning: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
    danger: "bg-[#FEF2F2] text-[#DC4545] border-[#FECACA]",
    purple: "bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${
        sizeClasses[size] || sizeClasses.md
      } ${variantClasses[variant] || variantClasses.neutral} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, className = "" }) {
  const norm = (status || "").toLowerCase();

  if (norm === "paid" || norm === "confirmed" || norm === "active" || norm === "available") {
    return (
      <Badge variant="success" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#16845B] mr-1.5" />
        {status === "paid" ? "Paid" : status === "confirmed" ? "Confirmed" : status === "available" ? "Available" : "Active"}
      </Badge>
    );
  }

  if (norm === "unpaid_demo" || norm === "demo reserved" || norm === "pending") {
    return (
      <Badge variant="warning" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] mr-1.5" />
        {norm === "pending" ? "Pending" : "Demo Reservation"}
      </Badge>
    );
  }

  if (norm === "cancelled" || norm === "failed" || norm === "rejected") {
    return (
      <Badge variant="danger" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#DC4545] mr-1.5" />
        {norm === "cancelled" ? "Cancelled" : norm === "failed" ? "Failed" : "Rejected"}
      </Badge>
    );
  }

  if (norm === "completed") {
    return (
      <Badge variant="neutral" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#64748B] mr-1.5" />
        Completed
      </Badge>
    );
  }

  return (
    <Badge variant="neutral" className={className}>
      {status || "Standard"}
    </Badge>
  );
}

export default Badge;
