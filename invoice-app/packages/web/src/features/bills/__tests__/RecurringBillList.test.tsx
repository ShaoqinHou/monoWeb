import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecurringBillList } from '../components/RecurringBillList';
import type { RecurringBill } from '../hooks/useRecurringBills';

const uuid = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

const SAMPLE_ITEMS: RecurringBill[] = [
  {
    id: uuid(1),
    templateName: 'Monthly Office Rent',
    contactId: uuid(101),
    contactName: 'Landlord Properties',
    frequency: 'monthly',
    nextDate: '2026-03-01',
    endDate: null,
    daysUntilDue: 20,
    status: 'active',
    subTotal: 2000,
    totalTax: 300,
    total: 2300,
    timesGenerated: 5,
    createdAt: '2025-10-01T00:00:00Z',
  },
  {
    id: uuid(2),
    templateName: 'Weekly Cleaning',
    contactId: uuid(102),
    contactName: 'CleanCo Ltd',
    frequency: 'weekly',
    nextDate: '2026-02-24',
    endDate: '2026-12-31',
    daysUntilDue: 7,
    status: 'paused',
    subTotal: 150,
    totalTax: 22.5,
    total: 172.5,
    timesGenerated: 10,
    createdAt: '2025-11-01T00:00:00Z',
  },
];

describe('RecurringBillList', () => {
  it('renders the table', () => {
    render(<RecurringBillList items={SAMPLE_ITEMS} onItemClick={vi.fn()} />);
    expect(screen.getByTestId('recurring-bill-list-table')).toBeInTheDocument();
  });

  it('renders table header columns', () => {
    render(<RecurringBillList items={SAMPLE_ITEMS} onItemClick={vi.fn()} />);
    expect(screen.getByText('Template Name')).toBeInTheDocument();
    expect(screen.getByText('Supplier')).toBeInTheDocument();
    expect(screen.getByText('Frequency')).toBeInTheDocument();
    expect(screen.getByText('Next Date')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Generated')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders all rows', () => {
    render(<RecurringBillList items={SAMPLE_ITEMS} onItemClick={vi.fn()} />);
    SAMPLE_ITEMS.forEach((item) => {
      expect(screen.getByTestId(`recurring-bill-row-${item.id}`)).toBeInTheDocument();
    });
  });

  it('displays template names', () => {
    render(<RecurringBillList items={SAMPLE_ITEMS} onItemClick={vi.fn()} />);
    expect(screen.getByText('Monthly Office Rent')).toBeInTheDocument();
    expect(screen.getByText('Weekly Cleaning')).toBeInTheDocument();
  });

  it('displays supplier names', () => {
    render(<RecurringBillList items={SAMPLE_ITEMS} onItemClick={vi.fn()} />);
    expect(screen.getByText('Landlord Properties')).toBeInTheDocument();
    expect(screen.getByText('CleanCo Ltd')).toBeInTheDocument();
  });

  it('calls onItemClick when a row is clicked', () => {
    const onClick = vi.fn();
    render(<RecurringBillList items={SAMPLE_ITEMS.slice(0, 1)} onItemClick={onClick} />);
    fireEvent.click(screen.getByTestId(`recurring-bill-row-${SAMPLE_ITEMS[0].id}`));
    expect(onClick).toHaveBeenCalledWith(SAMPLE_ITEMS[0].id);
  });

  it('shows empty state when no items', () => {
    render(<RecurringBillList items={[]} onItemClick={vi.fn()} />);
    expect(screen.getByTestId('recurring-bill-list-empty')).toBeInTheDocument();
    expect(screen.getByText('No repeating bills')).toBeInTheDocument();
    expect(screen.getByText('Set up bills that repeat on a schedule')).toBeInTheDocument();
    expect(screen.getByTestId('empty-new-recurring-bill-btn')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<RecurringBillList items={[]} onItemClick={vi.fn()} isLoading />);
    expect(screen.getByTestId('recurring-bill-list-loading')).toBeInTheDocument();
  });

  it('renders status badges', () => {
    render(<RecurringBillList items={SAMPLE_ITEMS} onItemClick={vi.fn()} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('displays times generated count', () => {
    render(<RecurringBillList items={SAMPLE_ITEMS} onItemClick={vi.fn()} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
