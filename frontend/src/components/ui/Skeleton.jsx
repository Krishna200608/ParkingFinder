import React from "react";

/**
 * Primitive Skeleton component with pulse animation for placeholder loading states.
 */
export function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#E2E8F0]/70 ${className}`}
      {...props}
    />
  );
}

/**
 * Multi-card skeleton loader for booking listings and spot cards.
 */
export function CardSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white border border-[#DDE3EA] rounded-xl p-4 space-y-3 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-64" />
          <div className="pt-2 flex items-center justify-between border-t border-[#F1F5F9]">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Detail page skeleton replicating hero, specs, and calendar panels.
 */
export function SpotDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-[#DDE3EA] rounded-xl p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-3/5" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-44 w-full rounded-lg" />
            <div className="grid grid-cols-3 gap-3 pt-3">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-[#DDE3EA] rounded-xl p-6 space-y-4 shadow-2xs">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Skeleton;

