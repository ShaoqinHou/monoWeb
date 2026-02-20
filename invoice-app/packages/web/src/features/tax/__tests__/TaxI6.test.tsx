// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaxAuditTable } from '../components/TaxAuditTable';
import { TaxAuditReportPage } from '../routes/TaxAuditReportPage';
import {
  filterTransactions,
  calculateTotals,
  MOCK_TRANSACTIONS,
} from '../hooks/useTaxAuditReport';
import type { TaxAuditTransaction, TaxAuditTotals } from '../hooks/useTaxAuditReport';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const SAMPLE_TRANSACTIONS: TaxAuditTransaction[] = [
  { id: '1', date: '2026-01-10', type: 'Invoice', reference: 'INV-001', contact: 'Alpha Co', netAmount: 1000, taxAmount: 150, grossAmount: 1150, taxRate: '15%', account: 'Sales' },
  { id: '2', date: '2026-01-15', type: 'Bill', reference: 'BILL-001', contact: 'Beta Ltd', netAmount: 500, taxAmount: 75, grossAmount: 575, taxRate: '15%', account: 'Office Expenses' },
  { id: '3', date: '2026-02-01', type: 'Invoice', reference: 'INV-002', contact: 'Gamma Inc', netAmount: 2000, taxAmount: 0, grossAmount: 2000, taxRate: '0%', account: 'Zero-rated Sales' },
];

const SAMPLE_TOTALS: TaxAuditTotals = {
  totalNet: 3500,
  totalTax: 225,
  totalGross: 3725,
};

describe('TaxAuditTable', () => {
  it('renders all columns', () => {
    render(<TaxAuditTable transactions={SAMPLE_TRANSACTIONS} totals={SAMPLE_TOTALS} />);
    const table = screen.getByTestId('tax-audit-table');
    expect(table).toBeInTheDocument();
    // Check headers exist
    expect(screen.getByTestId('sort-date')).toHaveTextContent('Date');
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Reference')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByTestId('sort-amount')).toHaveTextContent('Net');
    expect(screen.getByText('Tax')).toBeInTheDocument();
    expect(screen.getByText('Gross')).toBeInTheDocument();
  });

  it('renders transaction rows', () => {
    render(<TaxAuditTable transactions={SAMPLE_TRANSACTIONS} totals={SAMPLE_TOTALS} />);
    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('BILL-001')).toBeInTheDocument();
    expect(screen.getByText('INV-002')).toBeInTheDocument();
    expect(screen.getByText('Alpha Co')).toBeInTheDocument();
  });

  it('renders totals footer row', () => {
    render(<TaxAuditTable transactions={SAMPLE_TRANSACTIONS} totals={SAMPLE_TOTALS} />);
    const totalsRow = screen.getByTestId('totals-row');
    expect(totalsRow).toBeInTheDocument();
    expect(within(totalsRow).getByText('Total')).toBeInTheDocument();
  });

  it('sorts by date when clicking date header', async () => {
    const user = userEvent.setup();
    render(<TaxAuditTable transactions={SAMPLE_TRANSACTIONS} totals={SAMPLE_TOTALS} />);

    // Default sort is date ascending
    const rows = screen.getAllByRole('row');
    // rows[0] is header, rows[1..3] are data, rows[4] is totals
    expect(within(rows[1]).getByText('2026-01-10')).toBeInTheDocument();

    // Click date to sort descending
    await user.click(screen.getByTestId('sort-date'));
    const rowsAfter = screen.getAllByRole('row');
    expect(within(rowsAfter[1]).getByText('2026-02-01')).toBeInTheDocument();
  });
});

describe('filterTransactions', () => {
  it('filters by date range', () => {
    const result = filterTransactions(MOCK_TRANSACTIONS, {
      dateFrom: '2026-02-01',
      dateTo: '2026-02-28',
    });
    expect(result.every((tx) => tx.date >= '2026-02-01' && tx.date <= '2026-02-28')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('filters by tax rate', () => {
    const result = filterTransactions(MOCK_TRANSACTIONS, {
      dateFrom: '2025-01-01',
      dateTo: '2026-12-31',
      taxRate: '0%',
    });
    expect(result.every((tx) => tx.taxRate === '0%')).toBe(true);
    expect(result.length).toBe(2);
  });

  it('filters by account', () => {
    const result = filterTransactions(MOCK_TRANSACTIONS, {
      dateFrom: '2025-01-01',
      dateTo: '2026-12-31',
      account: 'Sales',
    });
    expect(result.every((tx) => tx.account === 'Sales')).toBe(true);
  });
});

describe('calculateTotals', () => {
  it('sums net, tax, and gross amounts', () => {
    const totals = calculateTotals(SAMPLE_TRANSACTIONS);
    expect(totals.totalNet).toBe(3500);
    expect(totals.totalTax).toBe(225);
    expect(totals.totalGross).toBe(3725);
  });

  it('returns zeros for empty array', () => {
    const totals = calculateTotals([]);
    expect(totals.totalNet).toBe(0);
    expect(totals.totalTax).toBe(0);
    expect(totals.totalGross).toBe(0);
  });
});

describe('TaxAuditReportPage', () => {
  it('renders page with title, filters, and export button', async () => {
    render(<TaxAuditReportPage />, { wrapper: createWrapper() });
    expect(screen.getByRole('heading', { name: 'Tax Audit Report' })).toBeInTheDocument();
    expect(screen.getByTestId('tax-audit-filters')).toBeInTheDocument();
    expect(screen.getByTestId('export-csv-button')).toBeInTheDocument();
  });
});
