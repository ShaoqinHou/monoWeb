import { DayType, DayKey, PowerPlan, WeeklyUsageProfiles, ZoneColor } from './types';

export const DAYS_IN_MONTH = 30;
export const WEEKDAYS_IN_MONTH = 21;
export const WEEKENDS_IN_MONTH = 9;

// Contact Energy Rates
// Rates include Electricity Authority Levy of 0.219c/kWh
const STD_DAILY = 293.4;
const STD_RATE = 26.22 + 0.219; // 26.439

const LOW_DAILY = 172.5;
const LOW_RATE = 31.625 + 0.219; // 31.844

// Mercury Energy Rates
const MERCURY_STD_DAILY = 310.5;
const MERCURY_STD_RATE = 23.87;

const MERCURY_LOW_DAILY = 172.5;
const MERCURY_LOW_RATE = 30.16;

// Genesis Energy Rates
const GENESIS_STD_DAILY = 294.96;
const GENESIS_STD_RATE = 25.53;

const GENESIS_LOW_DAILY = 138.00;
const GENESIS_LOW_RATE = 32.65;


export const DEFAULT_PLANS: PowerPlan[] = [
  // --- CONTACT ENERGY PLANS ---
  {
    id: 'contact-std-weekends',
    name: 'Good Weekends (Standard)',
    provider: 'Contact Energy',
    fixedDailyChargeCents: STD_DAILY,
    description: 'Free power 9am-5pm Saturday & Sunday. Standard rates apply otherwise.',
    broadbandMonthlyCost: 60,
    joiningCreditDollars: 300,
    rates: [
      { startHour: 9, endHour: 16, rateCents: 0, dayType: DayType.WEEKEND, zoneName: 'Free Power', zoneColor: ZoneColor.FREE },
      { startHour: 0, endHour: 23, rateCents: STD_RATE, dayType: DayType.ALL, zoneName: 'Anytime', zoneColor: ZoneColor.SHOULDER },
    ]
  },
  {
    id: 'contact-std-nights',
    name: 'Good Nights (Standard)',
    provider: 'Contact Energy',
    fixedDailyChargeCents: STD_DAILY,
    description: 'Free power 9pm-Midnight Mon-Fri. Standard rates apply otherwise.',
    broadbandMonthlyCost: 60,
    joiningCreditDollars: 300,
    rates: [
      { startHour: 21, endHour: 23, rateCents: 0, dayType: DayType.WEEKDAY, zoneName: 'Free Power', zoneColor: ZoneColor.FREE },
      { startHour: 0, endHour: 23, rateCents: STD_RATE, dayType: DayType.ALL, zoneName: 'Anytime', zoneColor: ZoneColor.SHOULDER },
    ]
  },
  {
    id: 'contact-std-charge',
    name: 'Good Charge (Standard)',
    provider: 'Contact Energy',
    fixedDailyChargeCents: STD_DAILY,
    description: 'Half price power 9pm-7am every night.',
    broadbandMonthlyCost: 60,
    joiningCreditDollars: 300,
    rates: [
      { startHour: 0, endHour: 6, rateCents: STD_RATE / 2, dayType: DayType.ALL, zoneName: 'Good Charge', zoneColor: ZoneColor.OFF_PEAK },
      { startHour: 7, endHour: 20, rateCents: STD_RATE, dayType: DayType.ALL, zoneName: 'Anytime', zoneColor: ZoneColor.SHOULDER },
      { startHour: 21, endHour: 23, rateCents: STD_RATE / 2, dayType: DayType.ALL, zoneName: 'Good Charge', zoneColor: ZoneColor.OFF_PEAK },
    ]
  },

  // --- LOW USER PLANS ---
  {
    id: 'contact-low-weekends',
    name: 'Good Weekends (Low User)',
    provider: 'Contact Energy',
    fixedDailyChargeCents: LOW_DAILY,
    description: 'Free power 9am-5pm Saturday & Sunday. Higher variable rates.',
    broadbandMonthlyCost: 60,
    joiningCreditDollars: 300,
    rates: [
      { startHour: 9, endHour: 16, rateCents: 0, dayType: DayType.WEEKEND, zoneName: 'Free Power', zoneColor: ZoneColor.FREE },
      { startHour: 0, endHour: 23, rateCents: LOW_RATE, dayType: DayType.ALL, zoneName: 'Anytime', zoneColor: ZoneColor.SHOULDER },
    ]
  },
  {
    id: 'contact-low-nights',
    name: 'Good Nights (Low User)',
    provider: 'Contact Energy',
    fixedDailyChargeCents: LOW_DAILY,
    description: 'Free power 9pm-Midnight Mon-Fri. Higher variable rates.',
    broadbandMonthlyCost: 60,
    joiningCreditDollars: 300,
    rates: [
      { startHour: 21, endHour: 23, rateCents: 0, dayType: DayType.WEEKDAY, zoneName: 'Free Power', zoneColor: ZoneColor.FREE },
      { startHour: 0, endHour: 23, rateCents: LOW_RATE, dayType: DayType.ALL, zoneName: 'Anytime', zoneColor: ZoneColor.SHOULDER },
    ]
  },
  {
    id: 'contact-low-charge',
    name: 'Good Charge (Low User)',
    provider: 'Contact Energy',
    fixedDailyChargeCents: LOW_DAILY,
    description: 'Half price power 9pm-7am every night. Higher variable rates.',
    broadbandMonthlyCost: 60,
    joiningCreditDollars: 300,
    rates: [
      { startHour: 0, endHour: 6, rateCents: LOW_RATE / 2, dayType: DayType.ALL, zoneName: 'Good Charge', zoneColor: ZoneColor.OFF_PEAK },
      { startHour: 7, endHour: 20, rateCents: LOW_RATE, dayType: DayType.ALL, zoneName: 'Anytime', zoneColor: ZoneColor.SHOULDER },
      { startHour: 21, endHour: 23, rateCents: LOW_RATE / 2, dayType: DayType.ALL, zoneName: 'Good Charge', zoneColor: ZoneColor.OFF_PEAK },
    ]
  },

  // --- MERCURY PLANS ---
  {
    id: 'mercury-std-flat',
    name: 'Flat Rate (Standard)',
    provider: 'Mercury',
    fixedDailyChargeCents: MERCURY_STD_DAILY,
    description: 'Simple flat rate all day. Standard user.',
    broadbandMonthlyCost: 65,
    joiningCreditDollars: 300,
    rates: [
        { startHour: 0, endHour: 23, rateCents: MERCURY_STD_RATE, dayType: DayType.ALL, zoneName: 'Anytime', zoneColor: ZoneColor.SHOULDER }
    ]
  },
  {
    id: 'mercury-low-flat',
    name: 'Flat Rate (Low User)',
    provider: 'Mercury',
    fixedDailyChargeCents: MERCURY_LOW_DAILY,
    description: 'Simple flat rate all day. Low user.',
    broadbandMonthlyCost: 65,
    joiningCreditDollars: 300,
    rates: [
        { startHour: 0, endHour: 23, rateCents: MERCURY_LOW_RATE, dayType: DayType.ALL, zoneName: 'Anytime', zoneColor: ZoneColor.SHOULDER }
    ]
  },

  // --- 2DEGREES PLANS ---
  {
    id: '2degrees-std',
    name: 'Standard Usage',
    provider: '2degrees',
    fixedDailyChargeCents: 348.0,
    description: 'Flat rate for standard users.',
    broadbandMonthlyCost: 65,
    joiningCreditDollars: 300,
    rates: [
      { startHour: 0, endHour: 23, rateCents: 29.42, dayType: DayType.ALL, zoneName: 'Anytime', zoneColor: ZoneColor.SHOULDER }
    ]
  },
  {
    id: '2degrees-low',
    name: 'Low Usage',
    provider: '2degrees',
    fixedDailyChargeCents: 172.5,
    description: 'Flat rate for low users.',
    broadbandMonthlyCost: 65,
    joiningCreditDollars: 300,
    rates: [
      { startHour: 0, endHour: 23, rateCents: 37.43, dayType: DayType.ALL, zoneName: 'Anytime', zoneColor: ZoneColor.SHOULDER }
    ]
  },

  // --- ELECTRIC KIWI PLANS ---
  {
    id: 'ek-everyday-std',
    name: 'Everyday (Standard)',
    provider: 'Electric Kiwi',
    fixedDailyChargeCents: 201.0,
    description: 'Flat rate all day.',
    broadbandMonthlyCost: 65,
    joiningCreditDollars: 300,
    rates: [
      { startHour: 0, endHour: 23, rateCents: 38.85, dayType: DayType.ALL, zoneName: 'Anytime', zoneColor: ZoneColor.SHOULDER }
    ]
  },
  {
    id: 'ek-everyday-low',
    name: 'Everyday (Low User)',
    provider: 'Electric Kiwi',
    fixedDailyChargeCents: 172.0,
    description: 'Flat rate all day. Higher per unit cost.',
    broadbandMonthlyCost: 65,
    joiningCreditDollars: 300,
    rates: [
      { startHour: 0, endHour: 23, rateCents: 40.3, dayType: DayType.ALL, zoneName: 'Anytime', zoneColor: ZoneColor.SHOULDER }
    ]
  },
  {
    id: 'ek-movemaster-std',
    name: 'MoveMaster (Standard)',
    provider: 'Electric Kiwi',
    fixedDailyChargeCents: 201.0,
    description: 'Peak/Off-Peak/Night rates to reward flexible usage.',
    broadbandMonthlyCost: 65,
    joiningCreditDollars: 300,
    rates: [
      // Night (11pm - 7am)
      { startHour: 23, endHour: 23, rateCents: 26.5, dayType: DayType.ALL, zoneName: 'Off-peak Night', zoneColor: ZoneColor.OFF_PEAK },
      { startHour: 0, endHour: 6, rateCents: 26.5, dayType: DayType.ALL, zoneName: 'Off-peak Night', zoneColor: ZoneColor.OFF_PEAK },
      
      // Weekdays
      // Peak: 7am-9am, 5pm-9pm
      { startHour: 7, endHour: 8, rateCents: 52.99, dayType: DayType.WEEKDAY, zoneName: 'Peak', zoneColor: ZoneColor.PEAK },
      { startHour: 17, endHour: 20, rateCents: 52.99, dayType: DayType.WEEKDAY, zoneName: 'Peak', zoneColor: ZoneColor.PEAK },
      // Shoulder: 9am-5pm, 9pm-11pm
      { startHour: 9, endHour: 16, rateCents: 31.8, dayType: DayType.WEEKDAY, zoneName: 'Shoulder', zoneColor: ZoneColor.SHOULDER },
      { startHour: 21, endHour: 22, rateCents: 31.8, dayType: DayType.WEEKDAY, zoneName: 'Shoulder', zoneColor: ZoneColor.SHOULDER },

      // Weekends
      // Shoulder: 7am-11pm
      { startHour: 7, endHour: 22, rateCents: 31.8, dayType: DayType.WEEKEND, zoneName: 'Shoulder', zoneColor: ZoneColor.SHOULDER },
    ]
  },
  {
    id: 'ek-movemaster-low',
    name: 'MoveMaster (Low User)',
    provider: 'Electric Kiwi',
    fixedDailyChargeCents: 115.0,
    description: 'Peak/Off-Peak/Night rates to reward flexible usage.',
    broadbandMonthlyCost: 65,
    joiningCreditDollars: 300,
    rates: [
      // Night (11pm - 7am)
      { startHour: 23, endHour: 23, rateCents: 29.61, dayType: DayType.ALL, zoneName: 'Off-peak Night', zoneColor: ZoneColor.OFF_PEAK },
      { startHour: 0, endHour: 6, rateCents: 29.61, dayType: DayType.ALL, zoneName: 'Off-peak Night', zoneColor: ZoneColor.OFF_PEAK },
      
      // Weekdays
      // Peak: 7am-9am, 5pm-9pm
      { startHour: 7, endHour: 8, rateCents: 59.23, dayType: DayType.WEEKDAY, zoneName: 'Peak', zoneColor: ZoneColor.PEAK },
      { startHour: 17, endHour: 20, rateCents: 59.23, dayType: DayType.WEEKDAY, zoneName: 'Peak', zoneColor: ZoneColor.PEAK },
      // Shoulder: 9am-5pm, 9pm-11pm
      { startHour: 9, endHour: 16, rateCents: 35.53, dayType: DayType.WEEKDAY, zoneName: 'Shoulder', zoneColor: ZoneColor.SHOULDER },
      { startHour: 21, endHour: 22, rateCents: 35.53, dayType: DayType.WEEKDAY, zoneName: 'Shoulder', zoneColor: ZoneColor.SHOULDER },

      // Weekends
      // Shoulder: 7am-11pm
      { startHour: 7, endHour: 22, rateCents: 35.53, dayType: DayType.WEEKEND, zoneName: 'Shoulder', zoneColor: ZoneColor.SHOULDER },
    ]
  },

  // --- GENESIS ENERGY PLANS ---
  {
    id: 'genesis-flexi-std',
    name: 'Flexi (Standard)',
    provider: 'Genesis Energy',
    fixedDailyChargeCents: GENESIS_STD_DAILY,
    description: 'Flexible plan with no exit fees. Standard User.',
    broadbandMonthlyCost: 70,
    discountPct: 3,
    rates: [
      { startHour: 0, endHour: 23, rateCents: GENESIS_STD_RATE, dayType: DayType.ALL, zoneName: 'Composite', zoneColor: ZoneColor.SHOULDER }
    ]
  },
  {
    id: 'genesis-fixed-std',
    name: 'Fixed (Standard)',
    provider: 'Genesis Energy',
    fixedDailyChargeCents: GENESIS_STD_DAILY,
    description: '12 months fixed for a discount. Standard User.',
    broadbandMonthlyCost: 70,
    discountPct: 6,
    rates: [
      { startHour: 0, endHour: 23, rateCents: GENESIS_STD_RATE, dayType: DayType.ALL, zoneName: 'Composite', zoneColor: ZoneColor.SHOULDER }
    ]
  },
  {
    id: 'genesis-flexi-low',
    name: 'Flexi (Low User)',
    provider: 'Genesis Energy',
    fixedDailyChargeCents: GENESIS_LOW_DAILY,
    description: 'Flexible plan with no exit fees. Low User.',
    broadbandMonthlyCost: 70,
    discountPct: 3,
    rates: [
      { startHour: 0, endHour: 23, rateCents: GENESIS_LOW_RATE, dayType: DayType.ALL, zoneName: 'Composite', zoneColor: ZoneColor.SHOULDER }
    ]
  },
  {
    id: 'genesis-fixed-low',
    name: 'Fixed (Low User)',
    provider: 'Genesis Energy',
    fixedDailyChargeCents: GENESIS_LOW_DAILY,
    description: '12 months fixed for a discount. Low User.',
    broadbandMonthlyCost: 70,
    discountPct: 6,
    rates: [
      { startHour: 0, endHour: 23, rateCents: GENESIS_LOW_RATE, dayType: DayType.ALL, zoneName: 'Composite', zoneColor: ZoneColor.SHOULDER }
    ]
  }
];

export const DAY_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const WEEKDAY_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
export const WEEKEND_KEYS: DayKey[] = ['sat', 'sun'];

export const DAY_KEY_TO_DAY_TYPE: Record<DayKey, DayType> = {
  mon: DayType.MON, tue: DayType.TUE, wed: DayType.WED, thu: DayType.THU,
  fri: DayType.FRI, sat: DayType.SAT, sun: DayType.SUN,
};

export const SPECIFIC_DAY_TYPES = [DayType.MON, DayType.TUE, DayType.WED, DayType.THU, DayType.FRI, DayType.SAT, DayType.SUN];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun'
};

export const DEFAULT_USAGE: number[] = Array(24).fill(0.5); // 0.5 kWh per hour default

export const DEFAULT_WEEKLY_PROFILES: WeeklyUsageProfiles = {
  mon: [...DEFAULT_USAGE],
  tue: [...DEFAULT_USAGE],
  wed: [...DEFAULT_USAGE],
  thu: [...DEFAULT_USAGE],
  fri: [...DEFAULT_USAGE],
  sat: [...DEFAULT_USAGE],
  sun: [...DEFAULT_USAGE],
};

export const USAGE_PATTERNS = {
  standard: {
    label: 'Standard',
    profile: [0.2, 0.2, 0.2, 0.2, 0.2, 0.3, 0.6, 1.2, 1.0, 0.6, 0.5, 0.5, 0.5, 0.5, 0.6, 0.8, 1.0, 1.5, 1.5, 1.2, 0.8, 0.6, 0.4, 0.3]
  },
  working: {
    label: 'Working Pro',
    profile: [0.2, 0.2, 0.2, 0.2, 0.2, 0.3, 1.0, 1.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.3, 0.5, 1.5, 1.8, 1.5, 1.0, 0.8, 0.4, 0.3]
  },
  wfh: {
    label: 'Home Office',
    profile: [0.2, 0.2, 0.2, 0.2, 0.2, 0.3, 0.5, 0.8, 1.0, 1.1, 1.1, 1.2, 1.2, 1.1, 1.0, 0.9, 1.0, 1.5, 1.6, 1.3, 1.0, 0.8, 0.4, 0.3]
  },
  ev: {
    label: 'EV Driver',
    profile: [2.5, 2.5, 2.5, 2.5, 0.2, 0.3, 0.8, 1.2, 0.5, 0.4, 0.4, 0.4, 0.4, 0.4, 0.5, 0.6, 0.9, 1.8, 1.8, 1.5, 1.0, 0.8, 0.4, 0.3]
  },
  nightowl: {
    label: 'Night Owl',
    profile: [1.0, 1.2, 1.0, 0.4, 0.2, 0.2, 0.2, 0.3, 0.4, 0.5, 0.5, 0.6, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.5, 1.5, 1.5, 1.2, 1.0]
  }
};