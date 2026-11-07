import React from "react";
import Button from "./Button";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  children,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-[#DDE3EA] rounded-xl bg-white ${className}`}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-[#F4F6F8] border border-[#DDE3EA] flex items-center justify-center text-[#64748B] mb-4">
          <Icon size={22} />
        </div>
      )}
      {title && (
        <h3 className="text-base font-semibold text-[#17243A] mb-1.5">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-[#64748B] max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && (onAction || actionHref) && (
        <Button
          variant="primary"
          size="sm"
          onClick={onAction}
          href={actionHref}
        >
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}

