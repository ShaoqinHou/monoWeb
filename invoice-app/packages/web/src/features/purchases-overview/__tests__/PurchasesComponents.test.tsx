import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PurchasesSummary } from '../components/PurchasesSummary';
import { RecentBills } from '../components/RecentBills';
import type { PurchasesSummaryData, RecentBill } from '../hooks/usePurchases';

// Mock TanStack Router (Link used in RecentBills)
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params, ...rest }: { children: React.ReactNode; to: string; params?: Record<string, string>; className?: string }) => (
    <a href={to} {...rest}>{children}</a>
  ),
}));

const mockSummary: PurchasesSummaryData = {
  totalPurchasesYTD: 50000,
  outstandingBills: 8000,
  overdueAmount: 2000,
};

const mockBills: RecentBill[] = [
  {
    id: 'bill-1',
    reference: 'BILL-001',
    supplier: 'Supplier A',
    amount: 750,
    date: '2026-01-20',
    status: 'paid',
  },
  {
    id: 'bill-2',
    reference: 'BILL-002',
    supplier: 'Supplier B',
    amount: 1200,
    date: '2026-02-03',
    status: 'awaiting_payment',
  },
];

describe('PurchasesSummary', () => {
  it('renders loading skeleton when isLoading is true', () => {
    render(<PurchasesSummary data={undefined} isLoading={true} />);
    expect(screen.getByTestId('purchases-summary-loading')).toBeInTheDocument();
  });

  it('renders all three summary cards with data', () => {
    render(<PurchasesSummary data={mockSummary} isLoading={false} />);
    expect(screen.getByTestId('purchases-summary')).toBeInTheDocument();
    expect(screen.getByText('Total Purchases (YTD)')).toBeInTheDocument();
    expect(screen.getByText('Outstanding Bills')).toBeInTheDocument();
    expect(screen.getByText('Overdue Amount')).toBeInTheDocument();
  });

  it('renders formatted currency values', () => {
    render(<PurchasesSummary data={mockSummary} isLoading={false} />);
    expect(screen.getByText('$50,000.00')).toBeInTheDocument();
    expect(screen.getByText('$8,000.00')).toBeInTheDocument();
    expect(screen.getByText('$2,000.00')).toBeInTheDocument();
  });

  it('renders nothing when data is undefined and not loading', () => {
    const { container } = render(<PurchasesSummary data={undefined} isLoading={false} />);
    expect(container.innerHTML).toBe('');
  });
});

describe('RecentBills', () => {
  it('renders loading skeleton when isLoading is true', () => {
    render(<RecentBills data={undefined} isLoading={true} />);
    expect(screen.getByTestId('recent-bills-loading')).toBeInTheDocument();
  });

  it('renders bill table with data', () => {
    render(<RecentBills data={mockBills} isLoading={false} />);
    expect(screen.getByText('BILL-001')).toBeInTheDocument();
    expect(screen.getByText('Supplier A')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  it('renders awaiting payment badge', () => {
    render(<RecentBills data={mockBills} isLoading={false} />);
    expect(screen.getByText('Awaiting Payment')).toBeInTheDocument();
    expect(screen.getByText('Supplier B')).toBeInTheDocument();
  });

  it('renders empty state when no bills', () => {
    render(<RecentBills data={[]} isLoading={false} />);
    expect(screen.getByText('No recent bills')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<RecentBills data={mockBills} isLoading={false} />);
    expect(screen.getByText('Reference')).toBeInTheDocument();
    expect(screen.getByText('Supplier')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
  });
});
