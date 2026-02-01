import { PowerPlan, DayType, DayKey, ZoneColor, CalculationResult, CostCategory, WeeklyUsageProfiles } from '../types';
import { DAYS_IN_MONTH, WEEKDAYS_IN_MONTH, WEEKENDS_IN_MONTH, DAY_KEYS, WEEKEND_KEYS, DAY_KEY_TO_DAY_TYPE } from '../constants';

const getColorHex = (zoneColor: ZoneColor): string => {
  switch (zoneColor) {
    case ZoneColor.PEAK: return '#ef4444'; // Red
    case ZoneColor.SHOULDER: return '#f97316'; // Orange
    case ZoneColor.OFF_PEAK: return '#22c55e'; // Green
    case ZoneColor.FREE: return '#3b82f6'; // Blue
    default: return '#94a3b8'; // Slate
  }
};

// 3-tier rate lookup: specific day (MON/TUE/..) > category (WEEKDAY/WEEKEND) > ALL
export const findRate = (plan: PowerPlan, hour: number, dayKey: DayKey) => {
    const specificDayType = DAY_KEY_TO_DAY_TYPE[dayKey];
    const categoryDayType = WEEKEND_KEYS.includes(dayKey) ? DayType.WEEKEND : DayType.WEEKDAY;
    const match = (dt: DayType) => plan.rates.find(r => r.startHour <= hour && r.endHour >= hour && r.dayType === dt);
    return match(specificDayType) || match(categoryDayType) || match(DayType.ALL);
};

export const getZoneColorForHour = (plan: PowerPlan, hour: number, dayKey: DayKey): string => {
    const rate = findRate(plan, hour, dayKey);
    if (!rate) return '#94a3b8';
    return getColorHex(rate.zoneColor);
}

export const calculateMonthlyCost = (plan: PowerPlan, weeklyProfiles: WeeklyUsageProfiles, includeBroadband: boolean = false, includeRewards: boolean = false): CalculationResult => {
  // 1. Calculate Fixed Charges
  const fixedCostCents = plan.fixedDailyChargeCents * DAYS_IN_MONTH;

  // 2. Calculate Broadband Cost (if applicable)
  const broadbandCostDollars = (includeBroadband && plan.broadbandMonthlyCost) ? plan.broadbandMonthlyCost : 0;

  // 3. Initialize Aggregators
  const categoryMap: Record<string, CostCategory> = {};

  const addToCategory = (name: string, cost: number, kwh: number, color: ZoneColor) => {
    if (!categoryMap[name]) {
      categoryMap[name] = {
        name,
        totalCost: 0,
        totalKwh: 0,
        avgRateCents: 0,
        color: getColorHex(color)
      };
    }
    categoryMap[name].totalCost += cost;
    categoryMap[name].totalKwh += kwh;
  };

  let totalVariableCost = 0;

  // Helper to find rate - uses shared 3-tier lookup
  const getRateForHour = (hour: number, dayKey: DayKey) => findRate(plan, hour, dayKey);

  // 4. Calculate usage per day of week
  // Each weekday (Mon-Fri) appears WEEKDAYS_IN_MONTH/5 times per month
  // Each weekend day (Sat-Sun) appears WEEKENDS_IN_MONTH/2 times per month
  const WEEKDAY_DAYS_EACH = WEEKDAYS_IN_MONTH / 5; // 4.2
  const WEEKEND_DAYS_EACH = WEEKENDS_IN_MONTH / 2;  // 4.5

  for (const dayKey of DAY_KEYS) {
    const daysPerMonth = WEEKEND_KEYS.includes(dayKey) ? WEEKEND_DAYS_EACH : WEEKDAY_DAYS_EACH;
    const usage = weeklyProfiles[dayKey];

    for (let hour = 0; hour < 24; hour++) {
      const kwhPerDay = usage[hour];
      const totalKwh = kwhPerDay * daysPerMonth;
      const rateObj = getRateForHour(hour, dayKey);

      if (rateObj) {
        const cost = totalKwh * rateObj.rateCents;
        totalVariableCost += cost;
        addToCategory(rateObj.zoneName, cost, totalKwh, rateObj.zoneColor);
      }
    }
  }

  // 6. Calculate Rewards (Discounts or Credits)
  let discountAmountDollars = 0;

  if (includeRewards) {
      // A. One-off Joining Credit (Amortized over 12 months)
      if (plan.joiningCreditDollars) {
          discountAmountDollars += plan.joiningCreditDollars / 12;
      }

      // B. Percentage Discount (e.g. Genesis)
      // Usually applies to Energy Cost (Fixed + Variable), excluding Broadband
      if (plan.discountPct) {
          const energyTotalDollars = (fixedCostCents + totalVariableCost) / 100;
          discountAmountDollars += energyTotalDollars * (plan.discountPct / 100);
      }
  }

  // Finalize categories (calc average rate)
  const categories = Object.values(categoryMap).map(cat => ({
      ...cat,
      avgRateCents: cat.totalKwh > 0 ? cat.totalCost / cat.totalKwh : 0,
      totalCost: cat.totalCost / 100 // Convert to dollars for final output
  })).sort((a, b) => b.totalCost - a.totalCost);

  // Total Calculation
  const totalEnergyDollars = (fixedCostCents + totalVariableCost) / 100;
  const finalMonthlyTotal = totalEnergyDollars + broadbandCostDollars - discountAmountDollars;

  return {
    planId: plan.id,
    monthlyTotal: finalMonthlyTotal,
    breakdown: {
      fixedCost: fixedCostCents / 100,
      usageCost: totalVariableCost / 100,
      broadbandCost: broadbandCostDollars,
      discountCost: discountAmountDollars,
      categories: categories
    },
  };
};