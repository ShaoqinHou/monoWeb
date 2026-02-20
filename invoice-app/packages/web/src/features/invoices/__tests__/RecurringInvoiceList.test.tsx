import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecurringInvoiceList } from '../components/RecurringInvoiceList';
import type { RecurringInvoice } from '../hooks/useRecurringInvoices';

const uuid = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

const SAMPLE_ITEMS: RecurringInvoice[] = [
  {
    id: uuid(1),
    templateName: 'Monthly Retainer',
    contactId: uuid(101),
    contactName: 'Acme Corp',
    frequency: 'monthly',
    nextDate: '2026-03-01',
    endDate: null,
    daysUntilDue: 14,
    status: 'active',
    subTotal: 1000,
    totalTax: 150,
    total: 1150,
    timesGenerated: 3,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: uuid(2),
    templateName: 'Quarterly Report',
    contactId: uuid(102),
    contactName: 'Bay Industries',
    frequency: 'quarterly',
    nextDate: '2026-04-01',
    endDate: '2027-01-01',
    daysUntilDue: 30,
    status: 'paused',
    subTotal: 5000,
    totalTax: 750,
    total: 5750,
    timesGenerated: 1,
    createdAt: '2026-01-15T00:00:00Z',
  },
];

describe('RecurringInvoiceList', () => {
  it('renders the table', () => {
    render(<RecurringInvoiceList items={SAMPLE_ITEMS} onItemClick={vi.fn()} />);
    expect(screen.getByTestId('recurring-invoice-list-table')).toBeInTheDocument();
  });

  it('renders table header columns', () => {
    render(<RecurringInvoiceList items={SAMPLE_ITEMS} onItemClick={vi.fn()} />);
    expect(screen.getByText('Template Name')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Frequency')).toBeInTheDocument();
    expect(screen.getByText('Next Date')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Generated')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders all rows', () => {
    render(<RecurringInvoiceList items={SAMPLE_ITEMS} onItemClick={vi.fn()} />);
    SAMPLE_ITEMS.forEach((item) => {
      expect(screen.getByTestId(`recurring-invoice-row-${item.id}`)).toBeInTheDocument();
    });
  });

  it('displays template names', () => {
    render(<RecurringInvoiceList items={SAMPLE_ITEMS} onItemClick={vi.fn()} />);
    expect(screen.getByText('Monthly Retainer')).toBeInTheDocument();
    expect(screen.getByText('Quarterly Report')).toBeInTheDocument();
  });

  it('calls onItemClick when a row is clicked', () => {
    const onClick = vi.fn();
    render(<RecurringInvoiceList items={SAMPLE_ITEMS.slice(0, 1)} onItemClick={onClick} />);
    fireEvent.click(screen.getByTestId(`recurring-invoice-row-${SAMPLE_ITEMS[0].id}`));
    expect(onClick).toHaveBeenCalledWith(SAMPLE_ITEMS[0].id);
  });

  it('shows empty state when no items', () => {
    render(<RecurringInvoiceList items={[]} onItemClick={vi.fn()} />);
    expect(screen.getByTestId('recurring-invoice-list-empty')).toBeInTheDocument();
    expect(screen.getByText('No recurring invoices found')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<RecurringInvoiceList items={[]} onItemClick={vi.fn()} isLoading />);
    expect(screen.getByTestId('recurring-invoice-list-loading')).toBeInTheDocument();
  });

  it('renders status badges', () => {
    render(<RecurringInvoiceList items={SAMPLE_ITEMS} onItemClick={vi.fn()} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('displays times generated count', () => {
    render(<RecurringInvoiceList items={SAMPLE_ITEMS} onItemClick={vi.fn()} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
