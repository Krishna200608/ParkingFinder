/**
 * Strongly-typed domain logic for parking marketplace pricing and commuter discounts.
 */

export interface PricingBreakdown {
  durationHours: number;
  hourlyRate: number;
  baseCost: number;
  discountPercentage: number;
  discountAmount: number;
  finalCost: number;
}

/**
 * Calculates standardized pricing and discounts across reservation durations.
 */
export function calculatePricingBreakdown(
  durationHours: number,
  hourlyRate: number,
  discountPercentage: number = 0
): PricingBreakdown {
  const safeHours = Math.max(0.25, Number(durationHours.toFixed(2)));
  const safeRate = Math.max(0, hourlyRate);
  const baseCost = Number((safeHours * safeRate).toFixed(2));
  const safeDiscount = Math.min(100, Math.max(0, discountPercentage));
  const discountAmount = Number(((baseCost * safeDiscount) / 100).toFixed(2));
  const finalCost = Number((baseCost - discountAmount).toFixed(2));

  return {
    durationHours: safeHours,
    hourlyRate: safeRate,
    baseCost,
    discountPercentage: safeDiscount,
    discountAmount,
    finalCost,
  };
}

/**
 * Calculates commuter pass duration from HH:mm intervals.
 */
export function calculateCommuterDuration(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
    return 0;
  }

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (endMinutes <= startMinutes) {
    return 0;
  }

  return Number(((endMinutes - startMinutes) / 60).toFixed(2));
}
