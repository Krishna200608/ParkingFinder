import React from "react";

export function Tabs({ tabs, activeTab, onChange, className = "" }) {
  return (
    <div className={`flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg border border-[#DDE3EA] w-fit ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all select-none cursor-pointer ${
              isActive
                ? "bg-white text-[#17243A] shadow-2xs border border-[#CBD5E1]/60"
                : "text-[#64748B] hover:text-[#17243A] hover:bg-white/50"
            }`}
          >
            {Icon && <Icon size={14} aria-hidden="true" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? "bg-[#EFF6FF] text-blue-700" : "bg-[#E2E8F0] text-[#64748B]"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
