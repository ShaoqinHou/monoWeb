/** Row type determines visual styling in ReportTable */
export type ReportRowType = 'header' | 'item' | 'total' | 'grand-total';

/** A single row in a report table */
export interface ReportRow {
  label: string;
  amount?: number;
  type: ReportRowType;
  indent?: number;
  /** When true, amount is rendered as a clickable link for drill-down */
  drillDown?: boolean;
}

/** A section of a report with optional nested subsections */
export interface ReportSection {
  rows: ReportRow[];
}

/** Complete report data structure */
export interface ReportData {
  title: string;
  subtitle: string;
  sections: ReportSection[];
}

/** Predefined date range presets */
export type DateRangePreset =
  | 'this-month'
  | 'last-month'
  | 'this-quarter'
  | 'last-quarter'
  | 'this-year'
  | 'last-year'
  | 'custom';

/** A date range with ISO date strings */
export interface DateRange {
  from: string;
  to: string;
}

/** Report card displayed on the hub page */
export interface ReportCardInfo {
  title: string;
  description: string;
  href: string;
  category: 'financial' | 'receivables' | 'payables' | 'tax' | 'overview' | 'payroll' | 'bank' | 'budgets';
}

/** P&L report response */
export interface ProfitAndLossReport {
  dateRange: DateRange;
  basis?: 'accrual' | 'cash';
  revenue: ReportLineItem[];
  costOfSales: ReportLineItem[];
  operatingExpenses: ReportLineItem[];
  grossProfit: number;
  netProfit: number;
  totalRevenue: number;
  totalCostOfSales: number;
  totalOperatingExpenses: number;
}

/** Balance sheet report response */
export interface BalanceSheetReport {
  asAt: string;
  currentAssets: ReportLineItem[];
  fixedAssets: ReportLineItem[];
  currentLiabilities: ReportLineItem[];
  equity: ReportLineItem[];
  totalCurrentAssets: number;
  totalFixedAssets: number;
  totalAssets: number;
  totalCurrentLiabilities: number;
  totalLiabilities: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
}

/** A single account line in a report */
export interface ReportLineItem {
  accountName: string;
  amount: number;
}

/** Aged report bucket (Current, 1-30, 31-60, 61-90, 90+) */
export interface AgedBucket {
  label: string;
  amount: number;
  count: number;
}

/** Aged receivables/payables report response */
export interface AgedReport {
  buckets: AgedBucket[];
  total: number;
}

/** Cash flow forecast report response */
export interface CashFlowForecastReport {
  openingBalance: number;
  closingBalance: number;
  periods: Array<{
    label: string;
    receivables: number;
    payables: number;
    netFlow: number;
    runningBalance: number;
  }>;
}
