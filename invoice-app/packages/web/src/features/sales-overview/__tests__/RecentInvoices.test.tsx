// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentInvoices } from '../components/RecentInvoices';
import type { RecentInvoice } from '../hooks/useSales';

const mockInvoices: RecentInvoice[] = [
  {
    id: 'inv-1',
    reference: 'INV-0101',
    customer: 'Acme Corp',
    amount: 5000,
    date: '2026-01-15',
    status: 'paid',
  },
  {
    id: 'inv-2',
    reference: 'INV-0102',
    customer: 'Globex Inc',
    amount: 3200.50,
    date: '2026-02-01',
    status: 'sent',
  },
  {
    id: 'inv-3',
    reference: 'INV-0103',
    customer: 'Initech',
    amount: 750,
    date: '2026-01-28',
    status: 'overdue',
  },
  {
    id: 'inv-4',
    reference: 'INV-0104',
    customer: 'Umbrella Ltd',
    amount: 1100,
    date: '2026-02-10',
    status: 'draft',
  },
];

describe('RecentInvoices', () => {
  it('renders the card with "Recent Invoices" heading', () => {
    render(<RecentInvoices data={mockInvoices} isLoading={false} />);
    expect(screen.getByTestId('recent-invoices')).toBeInTheDocument();
    expect(screen.getByText('Recent Invoices')).toBeInTheDocument();
  });

  it('renders loading skeleton with 3 placeholder rows', () => {
    render(<RecentInvoices data={undefined} isLoading={true} />);
    const loading = screen.getByTestId('recent-invoices-loading');
    expect(loading).toBeInTheDocument();
    const pulses = loading.querySelectorAll('.animate-pulse');
    expect(pulses.length).toBe(6); // 2 per row x 3 rows
  });

  it('renders empty state when data is empty array', () => {
    render(<RecentInvoices data={[]} isLoading={false} />);
    expect(screen.getByText('No recent invoices')).toBeInTheDocument();
  });

  it('renders all table headers', () => {
    render(<RecentInvoices data={mockInvoices} isLoading={false} />);
    expect(screen.getByText('Reference')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
  });

  it('renders all invoice references and customer names', () => {
    render(<RecentInvoices data={mockInvoices} isLoading={false} />);
    expect(screen.getByText('INV-0101')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('INV-0102')).toBeInTheDocument();
    expect(screen.getByText('Globex Inc')).toBeInTheDocument();
    expect(screen.getByText('INV-0103')).toBeInTheDocument();
    expect(screen.getByText('Initech')).toBeInTheDocument();
    expect(screen.getByText('INV-0104')).toBeInTheDocument();
    expect(screen.getByText('Umbrella Ltd')).toBeInTheDocument();
  });

  it('renders correct status badges for each status type', () => {
    render(<RecentInvoices data={mockInvoices} isLoading={false} />);
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('Sent')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders formatted currency amounts', () => {
    render(<RecentInvoices data={mockInvoices} isLoading={false} />);
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
    expect(screen.getByText('$3,200.50')).toBeInTheDocument();
    expect(screen.getByText('$750.00')).toBeInTheDocument();
    expect(screen.getByText('$1,100.00')).toBeInTheDocument();
  });

  it('renders empty message when data is undefined and not loading', () => {
    render(<RecentInvoices data={undefined} isLoading={false} />);
    // undefined data falls through to the empty state text
    expect(screen.getByText('No recent invoices')).toBeInTheDocument();
    expect(screen.queryByText('Reference')).not.toBeInTheDocument();
  });

  it('renders a single invoice correctly', () => {
    const single: RecentInvoice[] = [{
      id: 'solo',
      reference: 'INV-SOLO',
      customer: 'Solo Corp',
      amount: 999.99,
      date: '2026-03-01',
      status: 'paid',
    }];
    render(<RecentInvoices data={single} isLoading={false} />);
    expect(screen.getByText('INV-SOLO')).toBeInTheDocument();
    expect(screen.getByText('Solo Corp')).toBeInTheDocument();
    expect(screen.getByText('$999.99')).toBeInTheDocument();
  });
});
