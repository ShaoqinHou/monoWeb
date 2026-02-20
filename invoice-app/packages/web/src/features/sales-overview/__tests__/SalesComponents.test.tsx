// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SalesSummary } from '../components/SalesSummary';
import { RecentInvoices } from '../components/RecentInvoices';
import type { SalesSummaryData, RecentInvoice } from '../hooks/useSales';

const mockSummary: SalesSummaryData = {
  totalSalesYTD: 100000,
  outstandingInvoices: 20000,
  overdueAmount: 5000,
  averageDaysToPay: 15,
  invoiceCount: 42,
  paidCount: 28,
  overdueCount: 3,
};

const mockInvoices: RecentInvoice[] = [
  {
    id: 'inv-1',
    reference: 'INV-001',
    customer: 'Test Corp',
    amount: 1500,
    date: '2026-01-15',
    status: 'paid',
  },
  {
    id: 'inv-2',
    reference: 'INV-002',
    customer: 'Acme Ltd',
    amount: 2500,
    date: '2026-02-01',
    status: 'overdue',
  },
];

describe('SalesSummary', () => {
  it('renders loading skeleton when isLoading is true', () => {
    render(<SalesSummary data={undefined} isLoading={true} />);
    expect(screen.getByTestId('sales-summary-loading')).toBeInTheDocument();
  });

  it('renders all four summary cards with data', () => {
    render(<SalesSummary data={mockSummary} isLoading={false} />);
    expect(screen.getByTestId('sales-summary')).toBeInTheDocument();
    expect(screen.getByText('Total Sales (YTD)')).toBeInTheDocument();
    expect(screen.getByText('Outstanding Invoices')).toBeInTheDocument();
    expect(screen.getByText('Overdue Amount')).toBeInTheDocument();
    expect(screen.getByText('Average Days to Pay')).toBeInTheDocument();
  });

  it('renders formatted currency values', () => {
    render(<SalesSummary data={mockSummary} isLoading={false} />);
    expect(screen.getByText('$100,000.00')).toBeInTheDocument();
    expect(screen.getByText('$20,000.00')).toBeInTheDocument();
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
    expect(screen.getByText('15 days')).toBeInTheDocument();
  });

  it('renders nothing when data is undefined and not loading', () => {
    const { container } = render(<SalesSummary data={undefined} isLoading={false} />);
    expect(container.innerHTML).toBe('');
  });
});

describe('RecentInvoices', () => {
  it('renders loading skeleton when isLoading is true', () => {
    render(<RecentInvoices data={undefined} isLoading={true} />);
    expect(screen.getByTestId('recent-invoices-loading')).toBeInTheDocument();
  });

  it('renders invoice table with data', () => {
    render(<RecentInvoices data={mockInvoices} isLoading={false} />);
    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('Test Corp')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  it('renders overdue badge for overdue invoices', () => {
    render(<RecentInvoices data={mockInvoices} isLoading={false} />);
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('Acme Ltd')).toBeInTheDocument();
  });

  it('renders empty state when no invoices', () => {
    render(<RecentInvoices data={[]} isLoading={false} />);
    expect(screen.getByText('No recent invoices')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<RecentInvoices data={mockInvoices} isLoading={false} />);
    expect(screen.getByText('Reference')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
  });
});
