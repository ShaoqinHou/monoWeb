export enum RateType {
  FIXED = 'FIXED',
  TIME_OF_USE = 'TIME_OF_USE',
}

export enum DayType {
  ALL = 'ALL',
  WEEKDAY = 'WEEKDAY',
  WEEKEND = 'WEEKEND',
  MON = 'MON',
  TUE = 'TUE',
  WED = 'WED',
  THU = 'THU',
  FRI = 'FRI',
  SAT = 'SAT',
  SUN = 'SUN',
}

export enum ZoneColor {
  PEAK = 'PEAK',      // Red
  SHOULDER = 'SHOULDER', // Orange
  OFF_PEAK = 'OFF_PEAK', // Green
  FREE = 'FREE',      // Blue/Teal
}

export interface RateSegment {
  startHour: number; // 0-23
  endHour: number;   // 0-23 (inclusive of the start of the hour)
  rateCents: number;
  dayType: DayType;
  zoneName: string;
  zoneColor: ZoneColor;
}

export interface PowerPlan {
  id: string;
  name: string;
  provider: string;
  fixedDailyChargeCents: number;
  rates: RateSegment[];
  description?: string;
  broadbandMonthlyCost?: number; // Cost in Dollars
  joiningCreditDollars?: number; // One-off credit (e.g. 300)
  discountPct?: number; // Percentage discount off bill (e.g. 6)
}

// Array of 24 numbers representing kWh usage for each hour of the day
export type UsageProfile = number[];

export type UsageMode = 'simple' | 'weekday-weekend' | 'per-day';

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type WeeklyUsageProfiles = Record<DayKey, UsageProfile>;

export interface CostCategory {
  name: string;
  totalCost: number;
  totalKwh: number;
  avgRateCents: number; // Added for transparent breakdown
  color: string; 
}

export interface CalculationResult {
  planId: string;
  monthlyTotal: number;
  breakdown: {
    fixedCost: number;
    usageCost: number;
    broadbandCost: number;
    discountCost: number; // Negative number representing savings
    categories: CostCategory[]; 
  };
}