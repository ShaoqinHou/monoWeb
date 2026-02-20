// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentBills } from '../components/RecentBills';
import type { RecentBill } from '../hooks/usePurchases';

// Mock TanStack Router (Link used in RecentBills)
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...rest }: { children: React.ReactNode; to: string; params?: Record<string, string>; className?: string }) => (
    <a href={to} {...rest}>{children}</a>
  ),
}));

const mockBills: RecentBill[] = [
  {
    id: 'bill-1',
    reference: 'BILL-201',
    supplier: 'Paper Co',
    amount: 1250,
    date: '2026-01-20',
    status: 'paid',
  },
  {
    id: 'bill-2',
    reference: 'BILL-202',
    supplier: 'Office Supplies Ltd',
    amount: 3400.75,
    date: '2026-02-03',
    status: 'awaiting_payment',
  },
  {
    id: 'bill-3',
    reference: 'BILL-203',
    supplier: 'Cloud Hosting Inc',
    amount: 899,
    date: '2026-01-10',
    status: 'overdue',
  },
  {
    id: 'bill-4',
    reference: '',
    supplier: 'New Vendor',
    amount: 500,
    date: '2026-02-15',
    status: 'draft',
  },
];

describe('RecentBills', () => {
  it('renders the card with "Recent Bills" heading', () => {
    render(<RecentBills data={mockBills} isLoading={false} />);
    expect(screen.getByTestId('recent-bills')).toBeInTheDocument();
    expect(screen.getByText('Recent Bills')).toBeInTheDocument();
  });

  it('renders loading skeleton with 3 placeholder rows', () => {
    render(<RecentBills data={undefined} isLoading={true} />);
    const loading = screen.getByTestId('recent-bills-loading');
    expect(loading).toBeInTheDocument();
    const pulses = loading.querySelectorAll('.animate-pulse');
    expect(pulses.length).toBe(6); // 2 per row x 3 rows
  });

  it('renders empty state when data is empty array', () => {
    render(<RecentBills data={[]} isLoading={false} />);
    expect(screen.getByText('No recent bills')).toBeInTheDocument();
  });

  it('renders all table headers', () => {
    render(<RecentBills data={mockBills} isLoading={false} />);
    expect(screen.getByText('Reference')).toBeInTheDocument();
    expect(screen.getByText('Supplier')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
  });

  it('renders all bill references and supplier names', () => {
    render(<RecentBills data={mockBills} isLoading={false} />);
    expect(screen.getByText('BILL-201')).toBeInTheDocument();
    expect(screen.getByText('Paper Co')).toBeInTheDocument();
    expect(screen.getByText('BILL-202')).toBeInTheDocument();
    expect(screen.getByText('Office Supplies Ltd')).toBeInTheDocument();
    expect(screen.getByText('BILL-203')).toBeInTheDocument();
    expect(screen.getByText('Cloud Hosting Inc')).toBeInTheDocument();
  });

  it('falls back to bill id when reference is empty', () => {
    render(<RecentBills data={mockBills} isLoading={false} />);
    // bill-4 has empty reference, should display the id instead
    expect(screen.getByText('bill-4')).toBeInTheDocument();
  });

  it('renders correct status badges for each status type', () => {
    render(<RecentBills data={mockBills} isLoading={false} />);
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('Awaiting Payment')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders formatted currency amounts', () => {
    render(<RecentBills data={mockBills} isLoading={false} />);
    expect(screen.getByText('$1,250.00')).toBeInTheDocument();
    expect(screen.getByText('$3,400.75')).toBeInTheDocument();
    expect(screen.getByText('$899.00')).toBeInTheDocument();
    expect(screen.getByText('$500.00')).toBeInTheDocument();
  });

  it('renders bill row links pointing to bill detail page', () => {
    render(<RecentBills data={mockBills} isLoading={false} />);
    const link = screen.getByText('BILL-201');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/purchases/bills/$billId');
  });

  it('renders test id for each bill row', () => {
    render(<RecentBills data={mockBills} isLoading={false} />);
    expect(screen.getByTestId('recent-bill-row-bill-1')).toBeInTheDocument();
    expect(screen.getByTestId('recent-bill-row-bill-2')).toBeInTheDocument();
    expect(screen.getByTestId('recent-bill-row-bill-3')).toBeInTheDocument();
    expect(screen.getByTestId('recent-bill-row-bill-4')).toBeInTheDocument();
  });
});
