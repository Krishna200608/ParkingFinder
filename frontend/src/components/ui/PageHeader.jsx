import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export function PageHeader({
  title,
  description,
  breadcrumbs,
  action,
  actions,
  className = "",
}) {
  const actionSlot = action || actions;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#DDE3EA] ${className}`}
    >
      <div className="space-y-1">
        {Array.isArray(breadcrumbs) && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1.5" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight size={12} className="text-[#94A3B8]" />}
                {crumb.href ? (
                  <Link
                    to={crumb.href}
                    className="hover:text-[#17243A] transition hover:underline"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[#17243A] font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17243A]">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-[#64748B] max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actionSlot && <div className="flex items-center gap-2 shrink-0">{actionSlot}</div>}
    </div>
  );
}

export default PageHeader;
