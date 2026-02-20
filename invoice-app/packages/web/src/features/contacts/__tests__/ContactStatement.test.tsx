// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactStatement } from '../components/ContactStatement';
import type { Contact } from '../types';
import type { StatementTransaction } from '../types';

const MOCK_CONTACT: Contact = {
  id: 'c1',
  name: 'Acme Corporation',
  type: 'customer',
  email: 'info@acme.com',
  phone: '555-0100',
  outstandingBalance: 500,
  overdueBalance: 0,
  isArchived: false,
  createdAt: '2025-01-15T10:00:00.000Z',
  updatedAt: '2025-06-01T14:30:00.000Z',
};

const MOCK_TRANSACTIONS: StatementTransaction[] = [
  {
    date: '2025-01-15',
    type: 'invoice',
    number: 'INV-001',
    description: 'Website design services',
    debit: 1000,
    credit: 0,
    balance: 1000,
  },
  {
    date: '2025-02-01',
    type: 'payment',
    number: 'PMT-001',
    description: 'Payment received',
    debit: 0,
    credit: 500,
    balance: 500,
  },
  {
    date: '2025-03-01',
    type: 'invoice',
    number: 'INV-002',
    description: 'Hosting fees',
    debit: 250,
    credit: 0,
    balance: 750,
  },
  {
    date: '2025-03-15',
    type: 'credit-note',
    number: 'CN-001',
    description: 'Discount applied',
    debit: 0,
    credit: 100,
    balance: 650,
  },
];

describe('ContactStatement', () => {
  const defaultProps = {
    contact: MOCK_CONTACT,
    transactions: MOCK_TRANSACTIONS,
    dateRange: { start: '2025-01-01', end: '2025-12-31' },
    onDateRangeChange: vi.fn(),
    onPrint: vi.fn(),
    onEmail: vi.fn(),
  };

  it('renders transaction table', () => {
    render(<ContactStatement {...defaultProps} />);
    expect(screen.getByTestId('statement-table')).toBeInTheDocument();
    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('PMT-001')).toBeInTheDocument();
    expect(screen.getByText('INV-002')).toBeInTheDocument();
    expect(screen.getByText('CN-001')).toBeInTheDocument();
  });

  it('shows running balance column', () => {
    render(<ContactStatement {...defaultProps} />);
    // $1,000.00 appears in both debit and balance columns for first row
    const thousandTexts = screen.getAllByText('$1,000.00');
    expect(thousandTexts.length).toBeGreaterThan(1);
    // $650.00 appears in both the last row balance and the closing balance summary
    const closingTexts = screen.getAllByText('$650.00');
    expect(closingTexts.length).toBeGreaterThan(0);
  });

  it('renders date range inputs', () => {
    render(<ContactStatement {...defaultProps} />);
    expect(screen.getByTestId('statement-date-start')).toBeInTheDocument();
    expect(screen.getByTestId('statement-date-end')).toBeInTheDocument();
  });

  it('calls onDateRangeChange when date range is modified', async () => {
    const onDateRangeChange = vi.fn();
    const user = userEvent.setup();
    render(<ContactStatement {...defaultProps} onDateRangeChange={onDateRangeChange} />);

    const startInput = screen.getByTestId('statement-date-start');
    await user.clear(startInput);
    await user.type(startInput, '2025-06-01');

    expect(onDateRangeChange).toHaveBeenCalled();
  });

  it('calls onPrint when print button is clicked', async () => {
    const onPrint = vi.fn();
    const user = userEvent.setup();
    render(<ContactStatement {...defaultProps} onPrint={onPrint} />);

    await user.click(screen.getByTestId('statement-print-btn'));
    expect(onPrint).toHaveBeenCalledTimes(1);
  });

  it('calls onEmail when email button is clicked', async () => {
    const onEmail = vi.fn();
    const user = userEvent.setup();
    render(<ContactStatement {...defaultProps} onEmail={onEmail} />);

    await user.click(screen.getByTestId('statement-email-btn'));
    expect(onEmail).toHaveBeenCalledTimes(1);
  });

  it('shows summary section with totals', () => {
    render(<ContactStatement {...defaultProps} />);
    const summary = screen.getByTestId('statement-summary');
    expect(summary).toBeInTheDocument();
    // Total Invoiced (debits) = 1000 + 250 = 1250
    expect(summary.textContent).toContain('$1,250.00');
    // Total Paid (credits from payments) = 500
    expect(summary.textContent).toContain('$500.00');
  });

  it('shows closing balance', () => {
    render(<ContactStatement {...defaultProps} />);
    const summary = screen.getByTestId('statement-summary');
    // Closing balance = last transaction balance = 650
    expect(summary.textContent).toContain('$650.00');
  });

  it('shows contact name in statement header', () => {
    render(<ContactStatement {...defaultProps} />);
    expect(screen.getByTestId('statement-header')).toBeInTheDocument();
    expect(screen.getByTestId('statement-header').textContent).toContain('Acme Corporation');
  });

  it('renders all transaction rows', () => {
    render(<ContactStatement {...defaultProps} />);
    const rows = screen.getAllByTestId(/^statement-row-/);
    expect(rows).toHaveLength(4);
  });

  it('shows empty state when no transactions', () => {
    render(<ContactStatement {...defaultProps} transactions={[]} />);
    expect(screen.getByTestId('statement-empty')).toBeInTheDocument();
  });
});
