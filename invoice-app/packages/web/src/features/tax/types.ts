export interface GSTReturn {
  id: string;
  period: string; // "Jan-Feb 2026"
  startDate: string;
  endDate: string;
  dueDate: string;
  status: 'draft' | 'filed' | 'overdue';
  totalSales: number;
  gstOnSales: number;
  zeroRatedSupplies: number;
  totalPurchases: number;
  gstOnPurchases: number;
  netGST: number;
}

/** Tax summary computed from invoice/bill tax totals */
export interface TaxSummary {
  taxCollected: number;   // Output tax (on sales/invoices)
  taxPaid: number;        // Input tax (on purchases/bills)
  netGSTPayable: number;  // taxCollected - taxPaid
  periodCount: number;    // Number of filing periods
}
